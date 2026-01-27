import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateFolioDto,
  AddFolioItemDto,
  CreatePaymentDto,
  UpdateFolioStatusDto,
} from './dto/finance.dto.js';
import {
  FolioStatus,
  ChargeType,
  FolioItemSource,
  PaymentStatus,
} from '@prisma/client';
import { getTenantContext } from '../common/tenant-context.js';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  private getContext() {
    const context = getTenantContext();
    if (!context?.branchId || !context?.tenantId) {
      throw new BadRequestException('Tenant and Branch context are required');
    }
    return context;
  }

  async createFolio(createFolioDto: CreateFolioDto) {
    const { branchId, tenantId } = this.getContext();
    const { bookingId, isPrimary } = createFolioDto;

    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, branchId, tenantId },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    if (isPrimary) {
      await this.prisma.folio.updateMany({
        where: { bookingId, isPrimary: true, tenantId },
        data: { isPrimary: false },
      });
    }

    return this.prisma.folio.create({
      data: {
        bookingId,
        branchId,
        tenantId,
        status: FolioStatus.OPEN,
        isPrimary: !!isPrimary,
      },
      include: {
        booking: {
          include: { primaryGuest: true },
        },
      },
    });
  }

  async findOneFolio(id: string) {
    const { branchId, tenantId } = this.getContext();
    const folio = await this.prisma.folio.findFirst({
      where: { id, branchId, tenantId },
      include: {
        items: true,
        payments: {
          include: { staff: true },
        },
        booking: {
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
          },
        },
      },
    });
    if (!folio) throw new NotFoundException('Folio not found');
    return folio;
  }

  async addItem(
    folioId: string,
    addItemDto: AddFolioItemDto,
    staffId?: string,
  ) {
    const { tenantId } = this.getContext();
    const folio = await this.findOneFolio(folioId);

    if (folio.status === FolioStatus.CLOSED) {
      throw new BadRequestException('Cannot add item to a closed folio');
    }

    return this.prisma.folioItem.create({
      data: {
        folioId,
        tenantId,
        description: addItemDto.description,
        unitPrice: addItemDto.unitPrice,
        taxRate: addItemDto.taxRate || 0,
        taxAmount: addItemDto.taxAmount || 0,
        totalAmount: addItemDto.totalAmount,
        quantity: addItemDto.quantity || 1,
        type: addItemDto.type,
        source: addItemDto.source || FolioItemSource.MANUAL,
        staffId,
      },
    });
  }

  async adjustCharge(folioId: string, itemId: string, staffId: string) {
    const { tenantId } = this.getContext();
    const item = await this.prisma.folioItem.findFirst({
      where: { id: itemId, folioId, tenantId },
    });

    if (!item) throw new NotFoundException('Folio item not found');

    const folio = await this.findOneFolio(folioId);
    if (folio.status === FolioStatus.CLOSED) {
      throw new BadRequestException('Cannot adjust item on a closed folio');
    }

    return this.prisma.folioItem.create({
      data: {
        folioId,
        tenantId,
        description: `Correction: ${item.description}`,
        unitPrice: Number(item.unitPrice) * -1,
        taxRate: item.taxRate,
        taxAmount: Number(item.taxAmount) ? Number(item.taxAmount) * -1 : 0,
        totalAmount: Number(item.totalAmount) * -1,
        quantity: 1,
        type: item.type,
        source: FolioItemSource.SYSTEM,
        staffId,
      },
    });
  }

  async recordPayment(
    folioId: string,
    createPaymentDto: CreatePaymentDto,
    staffId: string,
  ) {
    const { tenantId, branchId } = this.getContext();
    const folio = await this.findOneFolio(folioId);

    if (folio.status === FolioStatus.CLOSED) {
      throw new BadRequestException('Cannot add payment to a closed folio');
    }

    return this.prisma.payment.create({
      data: {
        ...createPaymentDto,
        folioId,
        staffId,
        tenantId,
        status: createPaymentDto.status || PaymentStatus.COMPLETED,
      },
    });
  }

  async updateFolioStatus(
    id: string,
    updateFolioStatusDto: UpdateFolioStatusDto,
  ) {
    const { tenantId } = this.getContext();
    await this.findOneFolio(id);
    return this.prisma.folio.update({
      where: { id, tenantId },
      data: updateFolioStatusDto,
    });
  }

  async getFolioBalance(id: string) {
    const folio = await this.findOneFolio(id);

    const totalCharges = folio.items.reduce(
      (sum, item) => sum + Number(item.totalAmount),
      0,
    );
    const totalPayments = folio.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );

    return {
      totalCharges,
      totalPayments,
      balance: totalCharges - totalPayments,
    };
  }

  async getRoomChargesSummary(id: string) {
    const folio = await this.findOneFolio(id);
    const booking = folio.booking;

    if (!booking) {
      return null;
    }

    // Calculate nights
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    const nights = Math.max(
      1,
      Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );

    // Sum up room charge items already on the folio
    const roomChargeItems = folio.items.filter(
      (i) => i.type === ChargeType.ROOM_CHARGE,
    );
    const totalRoomChargesPost = roomChargeItems.reduce(
      (sum, item) => sum + Number(item.totalAmount),
      0,
    );

    // If no room charges posted yet, estimate based on primary room stay
    let ratePerNight = 0;
    let totalRoomCharges = totalRoomChargesPost;
    let isEstimated = roomChargeItems.length === 0;

    if (booking.roomStays && booking.roomStays.length > 0) {
      ratePerNight = Number(booking.roomStays[0].dailyRate);
      if (isEstimated) {
        totalRoomCharges = ratePerNight * nights;
      } else {
        // If we have actual charges, derive average rate
        ratePerNight = totalRoomCharges / nights;
      }
    }

    return {
      nights,
      ratePerNight,
      totalRoomCharges,
      isEstimated,
    };
  }

  async findAllFolios(params: {
    skip?: number;
    take?: number;
    search?: string;
    status?: FolioStatus;
  }) {
    const { branchId, tenantId } = this.getContext();
    const where: any = { branchId, tenantId };

    if (params.status && (params.status as string) !== 'ALL') {
      where.status = params.status;
    }

    if (params.search) {
      where.OR = [
        { id: { contains: params.search, mode: 'insensitive' } },
        {
          booking: {
            OR: [
              {
                primaryGuest: {
                  OR: [
                    {
                      firstName: {
                        contains: params.search,
                        mode: 'insensitive',
                      },
                    },
                    {
                      lastName: {
                        contains: params.search,
                        mode: 'insensitive',
                      },
                    },
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
            ],
          },
        },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.folio.findMany({
        where,
        skip: params.skip || 0,
        take: params.take || 10,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          payments: true,
          booking: {
            include: {
              primaryGuest: true,
              roomStays: {
                include: { room: true },
              },
            },
          },
        },
      }),
      this.prisma.folio.count({ where }),
    ]);

    return { data, total };
  }

  async getFolioStats() {
    const { branchId, tenantId } = this.getContext();
    const [total, open, closed] = await Promise.all([
      this.prisma.folio.count({ where: { branchId, tenantId } }),
      this.prisma.folio.count({
        where: { branchId, tenantId, status: FolioStatus.OPEN },
      }),
      this.prisma.folio.count({
        where: { branchId, tenantId, status: FolioStatus.CLOSED },
      }),
    ]);
    return {
      activeAccounts: open,
      totalFolios: total,
      openFolios: open,
      closedFolios: closed,
    };
  }

  async findAllByBooking(bookingId: string) {
    const { branchId, tenantId } = this.getContext();
    return this.prisma.folio.findMany({
      where: {
        bookingId,
        branchId,
        tenantId,
      },
      include: { items: true, payments: true },
    });
  }
}
