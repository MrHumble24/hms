import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBookingDto, UpdateBookingDto } from './dto/bookings.dto.js';
import { CheckoutDto } from './dto/checkout.dto.js';
import {
  BookingStatus,
  FolioStatus,
  RoomStatus,
  TaskStatus,
  Priority,
  ChargeType,
  FolioItemSource,
  RoomStayStatus,
  HousekeepingTaskType,
  BookingSource, // Added BookingSource
} from '@prisma/client';
import { getTenantContext } from '../common/tenant-context.js';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  private getContext() {
    const context = getTenantContext();
    if (!context?.branchId || !context?.tenantId) {
      throw new BadRequestException('Tenant and Branch context are required');
    }
    return context;
  }

  async create(createBookingDto: CreateBookingDto) {
    const { tenantId, branchId } = this.getContext();

    return this.prisma.$transaction(async (tx) => {
      const {
        primaryGuestId,
        ratePlanId,
        companyId,
        specialRequests,
        source,
        roomStays,
        checkIn,
        checkOut,
        adultsCount,
        childrenCount,
      } = createBookingDto;

      // 1. Create Booking Header
      const booking = await tx.booking.create({
        data: {
          tenantId,
          branchId,
          primaryGuestId,
          ratePlanId,
          companyId,
          source: source || BookingSource.WALK_IN,
          status: BookingStatus.CONFIRMED,
          checkIn: new Date(checkIn),
          checkOut: new Date(checkOut),
        },
      });

      // 1.1 Check for active corporate discount
      let companyDiscount = 0;
      if (companyId) {
        const activeContract = await tx.discountContract.findFirst({
          where: {
            companyId,
            isActive: true,
            startDate: { lte: new Date() },
            OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
          },
          orderBy: { createdAt: 'desc' },
        });
        if (activeContract) {
          companyDiscount = activeContract.discountPercent;
        }
      }

      // 2. Create Room Stays (Line Items)
      if (roomStays && roomStays.length > 0) {
        for (const stay of roomStays) {
          if (!stay.roomId) continue;

          // --- AVAILABILITY CHECK & LOCKING ---
          // Use FOR UPDATE to lock the room record during this transaction
          // This prevents race conditions where two transactions check availability at the same time
          await tx.$executeRaw`SELECT id FROM "Room" WHERE id = ${stay.roomId} FOR UPDATE`;

          // Check for overlapping stays for this specific room
          const overlappingStay = await tx.roomStay.findFirst({
            where: {
              roomId: stay.roomId,
              status: {
                in: [RoomStayStatus.RESERVED, RoomStayStatus.CHECKED_IN],
              },
              AND: [
                { startDate: { lt: new Date(stay.endDate) } },
                { endDate: { gt: new Date(stay.startDate) } },
              ],
            },
          });

          if (overlappingStay) {
            throw new BadRequestException(
              `Room ${stay.roomId} is already occupied or reserved during the selected dates.`,
            );
          }
          // ------------------------------------

          let dailyRate = 0;

          // If a rate plan is provided, try to find the specific price for this room type
          if (ratePlanId && stay.roomId) {
            const room = await tx.room.findFirst({
              where: { id: stay.roomId, branchId, tenantId },
            });
            if (room) {
              const planRoomType = await tx.ratePlanRoomType.findFirst({
                where: { ratePlanId, roomTypeId: room.typeId },
              });
              if (planRoomType) {
                dailyRate = Number(planRoomType.price);
              } else {
                // Fallback to base price if not in rate plan
                const roomWithType = await tx.room.findFirst({
                  where: { id: stay.roomId },
                  include: { type: true },
                });
                dailyRate = Number(roomWithType?.type.basePrice || 0);
              }
            }
          } else if (stay.roomId) {
            const room = await tx.room.findFirst({
              where: { id: stay.roomId },
              include: { type: true },
            });
            dailyRate = Number(room?.type.basePrice || 0);
          }

          // Apply corporate discount if any
          if (companyDiscount > 0) {
            dailyRate = dailyRate * (1 - companyDiscount / 100);
            // Round to 2 decimal places to be safe with Decimal type
            dailyRate = Math.round(dailyRate * 100) / 100;
          }

          await tx.roomStay.create({
            data: {
              bookingId: booking.id,
              tenantId,
              roomId: stay.roomId,
              startDate: new Date(stay.startDate),
              endDate: new Date(stay.endDate),
              dailyRate,
              adultsCount: stay.adultsCount || 1,
              childrenCount: stay.childrenCount || 0,
              status: RoomStayStatus.RESERVED,
            },
          });
        }
      }

      // 3. Create Primary Folio
      await tx.folio.create({
        data: {
          bookingId: booking.id,
          tenantId,
          branchId,
          status: FolioStatus.OPEN,
          isPrimary: true,
        },
      });

      return tx.booking.findFirst({
        where: { id: booking.id, tenantId, branchId },
        include: {
          primaryGuest: true,
          roomStays: { include: { room: { include: { type: true } } } },
          folios: true,
        },
      });
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    search?: string;
    status?: string;
    source?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const { branchId, tenantId } = this.getContext();
    const where: any = { branchId, tenantId };

    console.log('📋 Booking filter params:', {
      status: params.status,
      source: params.source,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    });

    if (params.status && params.status !== 'ALL') {
      where.status = params.status;
    }

    if (params.source && params.source !== 'ALL') {
      where.source = params.source as BookingSource;
    }

    console.log('🔍 Booking where clause:', JSON.stringify(where, null, 2));

    // Date range filter (check-in date range)
    if (params.dateFrom || params.dateTo) {
      where.checkIn = {};
      if (params.dateFrom) {
        where.checkIn.gte = new Date(params.dateFrom);
      }
      if (params.dateTo) {
        where.checkIn.lte = new Date(params.dateTo);
      }
    }

    if (params.search) {
      where.OR = [
        {
          primaryGuest: {
            OR: [
              { firstName: { contains: params.search, mode: 'insensitive' } },
              { lastName: { contains: params.search, mode: 'insensitive' } },
            ],
          },
        },
        {
          roomStays: {
            some: {
              room: {
                number: { contains: params.search, mode: 'insensitive' },
              },
            },
          },
        },
        {
          company: {
            name: { contains: params.search, mode: 'insensitive' },
          },
        },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip: params.skip || 0,
        take: params.take || 10,
        include: {
          primaryGuest: true,
          company: true,
          roomStays: {
            include: {
              room: {
                include: {
                  type: true,
                },
              },
            },
          },
          folios: {
            include: {
              items: true,
              payments: true,
            },
          },
        },
        orderBy: { checkIn: 'desc' },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(id: string) {
    const { branchId, tenantId } = this.getContext();
    const booking = await this.prisma.booking.findFirst({
      where: { id, branchId, tenantId },
      include: {
        primaryGuest: true,
        roomStays: {
          include: {
            room: {
              include: {
                type: true,
              },
            },
          },
        },
        folios: {
          include: {
            items: true,
            payments: true,
          },
        },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async update(
    id: string,
    updateBookingDto: UpdateBookingDto,
    staffId?: string,
  ) {
    const { branchId, tenantId } = this.getContext();
    const existingBooking = await this.findOne(id);

    // If status is changing to CHECKED_IN, post room charges and update room stays
    if (
      updateBookingDto.status === BookingStatus.CHECKED_IN &&
      existingBooking.status !== BookingStatus.CHECKED_IN
    ) {
      await this.postRoomChargesForCheckIn(id, staffId);

      await this.prisma.roomStay.updateMany({
        where: { bookingId: id },
        data: { status: RoomStayStatus.CHECKED_IN },
      });
    }

    return this.prisma.booking.update({
      where: { id, tenantId },
      data: updateBookingDto,
      include: { primaryGuest: true, roomStays: true },
    });
  }

  private async postRoomChargesForCheckIn(bookingId: string, staffId?: string) {
    const { branchId, tenantId } = this.getContext();
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findFirst({
        where: { id: bookingId, branchId, tenantId },
        include: {
          roomStays: {
            include: {
              room: {
                include: {
                  type: true,
                },
              },
            },
          },
          folios: true,
        },
      });

      if (!booking) throw new BadRequestException('Booking not found');

      const primaryFolio = booking.folios.find((f) => f.isPrimary);
      if (!primaryFolio)
        throw new BadRequestException('No primary folio found');

      for (const stay of booking.roomStays) {
        if (!stay.room) continue;

        const checkInDate = new Date(stay.startDate);
        const checkOutDate = new Date(stay.endDate);
        const daysDiff = Math.ceil(
          (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24),
        );
        const expectedNights = Math.max(1, daysDiff);
        const roomRate =
          Number(stay.dailyRate) || Number(stay.room.type.basePrice);

        await tx.folioItem.create({
          data: {
            folioId: primaryFolio.id,
            tenantId,
            description: `Room charge: ${stay.room.number} (${stay.room.type.name}) - ${expectedNights} nights`,
            unitPrice: roomRate,
            taxRate: 0,
            taxAmount: 0,
            totalAmount: roomRate * expectedNights,
            quantity: expectedNights,
            type: ChargeType.ROOM_CHARGE,
            source: FolioItemSource.SYSTEM,
            staffId: staffId || undefined,
          },
        });
      }
    });
  }

  async remove(id: string) {
    const { branchId, tenantId } = this.getContext();
    await this.findOne(id);
    return this.prisma.booking.delete({ where: { id, tenantId } });
  }

  async findActiveByRoom(roomId: string) {
    const { branchId, tenantId } = this.getContext();
    const now = new Date();
    return this.prisma.booking.findFirst({
      where: {
        tenantId,
        branchId,
        status: { in: ['CONFIRMED', 'CHECKED_IN'] },
        roomStays: {
          some: {
            roomId,
            startDate: { lte: now },
            endDate: { gte: now },
          },
        },
      },
      include: { primaryGuest: true, roomStays: true },
    });
  }

  async checkout(id: string, checkoutDto: CheckoutDto, staffId: string) {
    const { branchId, tenantId } = this.getContext();
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findFirst({
        where: { id, branchId, tenantId },
        include: {
          roomStays: { include: { room: true } },
          folios: { include: { items: true, payments: true } },
          primaryGuest: true,
        },
      });

      if (!booking) throw new NotFoundException('Booking not found');

      // Update Booking status
      const updatedBooking = await tx.booking.update({
        where: { id, tenantId },
        data: {
          status: BookingStatus.CHECKED_OUT,
        },
      });

      // Update Room Stays status
      await tx.roomStay.updateMany({
        where: { bookingId: id, tenantId },
        data: { status: RoomStayStatus.CHECKED_OUT },
      });

      // Update Rooms status and create housekeeping tasks
      for (const stay of booking.roomStays) {
        if (stay.roomId) {
          const newStatus =
            checkoutDto.roomStatus ||
            (checkoutDto.maintenanceNotes
              ? RoomStatus.MAINTENANCE
              : RoomStatus.DIRTY);
          await tx.room.update({
            where: { id: stay.roomId, tenantId },
            data: { status: newStatus },
          });

          // Create Cleanup Task
          await tx.housekeepingTask.create({
            data: {
              roomId: stay.roomId,
              tenantId,
              status: TaskStatus.PENDING,
              taskType: HousekeepingTaskType.CHECKOUT_CLEAN,
              priority: checkoutDto.maintenanceNotes
                ? Priority.HIGH
                : Priority.MEDIUM,
              notes:
                checkoutDto.maintenanceNotes || 'Standard checkout cleaning',
              createdById: staffId,
              scheduledFor: new Date(),
            },
          });
        }
      }

      // Folio Closing
      const primaryFolio = booking.folios.find((f) => f.isPrimary);
      if (primaryFolio) {
        await tx.folio.update({
          where: { id: primaryFolio.id, tenantId },
          data: { status: FolioStatus.CLOSED },
        });
      }

      // Calculate totals for receipt
      const totalCharges =
        primaryFolio?.items.reduce(
          (sum, item) => sum + Number(item.totalAmount),
          0,
        ) || 0;
      const totalPayments =
        primaryFolio?.payments.reduce((sum, p) => sum + Number(p.amount), 0) ||
        0;

      return {
        booking: updatedBooking,
        message: 'Checkout completed successfully',
        receipt: {
          bookingId: booking.id,
          guestName: `${booking.primaryGuest.firstName} ${booking.primaryGuest.lastName}`,
          roomNumber: booking.roomStays[0]?.room?.number || 'N/A',
          checkIn: booking.checkIn,
          checkOut: new Date(),
          totalCharges,
          totalPayments,
          balance: totalCharges - totalPayments,
          folioItems:
            primaryFolio?.items.map((item) => ({
              description: item.description,
              amount: item.unitPrice,
              quantity: item.quantity,
            })) || [],
          payments:
            primaryFolio?.payments.map((p) => ({
              method: p.method,
              amount: p.amount,
              transactionRef: p.transactionRef,
            })) || [],
          checkoutNotes: checkoutDto.notes,
        },
      };
    });
  }
}
