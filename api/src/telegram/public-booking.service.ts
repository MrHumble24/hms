import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CheckAvailabilityDto,
  CreatePublicBookingDto,
} from './dto/public-booking.dto.js';
import {
  RoomStayStatus,
  BookingStatus,
  BookingSource,
  Gender,
} from '@prisma/client';

@Injectable()
export class PublicBookingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Check available room types for a branch on given dates
   */
  async checkAvailability(dto: CheckAvailabilityDto) {
    const { branchId, checkIn, checkOut, guests = 1 } = dto;

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Validate dates
    if (checkInDate >= checkOutDate) {
      throw new BadRequestException(
        'Check-out date must be after check-in date',
      );
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkInDate < today) {
      throw new BadRequestException('Check-in date cannot be in the past');
    }

    // Get branch details
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      include: { tenant: true },
    });

    if (!branch || !branch.isActive || !branch.tenant.isActive) {
      throw new BadRequestException('Hotel not found or currently unavailable');
    }

    // Get all room types for this branch
    const roomTypes = await this.prisma.roomType.findMany({
      where: { branchId },
      include: {
        rooms: {
          where: {
            deletedAt: null,
            capacity: { gte: guests },
          },
          include: {
            roomStays: {
              where: {
                status: { not: RoomStayStatus.CANCELLED },
                AND: [
                  { startDate: { lt: checkOutDate } },
                  { endDate: { gt: checkInDate } },
                ],
              },
            },
          },
        },
      },
    });

    // Calculate availability
    const availability = roomTypes.map((roomType) => {
      const totalRooms = roomType.rooms.length;
      const occupiedRooms = roomType.rooms.filter(
        (room) => room.roomStays.length > 0,
      ).length;
      const availableRooms = totalRooms - occupiedRooms;

      return {
        id: roomType.id,
        name: roomType.name,
        description: roomType.description,
        amenities: roomType.amenities,
        images: roomType.images,
        basePrice: roomType.basePrice,
        totalRooms,
        availableRooms,
        isAvailable: availableRooms > 0,
      };
    });

    // Filter to only available room types
    return {
      branch: {
        id: branch.id,
        name: branch.name,
        address: branch.address,
        checkInTime: branch.checkInTime,
        checkOutTime: branch.checkOutTime,
        currency: branch.currency,
      },
      checkIn,
      checkOut,
      nights: Math.ceil(
        (checkOutDate.getTime() - checkInDate.getTime()) /
          (1000 * 60 * 60 * 24),
      ),
      roomTypes: availability.filter((rt) => rt.isAvailable),
    };
  }

  /**
   * Create a public booking (from Telegram or website)
   */
  async createPublicBooking(dto: CreatePublicBookingDto) {
    const checkInDate = new Date(dto.checkIn);
    const checkOutDate = new Date(dto.checkOut);

    // Validate dates
    if (checkInDate >= checkOutDate) {
      throw new BadRequestException(
        'Check-out date must be after check-in date',
      );
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkInDate < today) {
      throw new BadRequestException('Check-in date cannot be in the past');
    }
    const branch = await this.prisma.branch.findUnique({
      where: { id: dto.branchId },
      include: { tenant: true },
    });

    if (!branch || !branch.isActive) {
      throw new BadRequestException('Hotel not available');
    }

    const tenantId = branch.tenantId;

    // Get room type and find an available room
    const roomType = await this.prisma.roomType.findUnique({
      where: { id: dto.roomTypeId },
      include: {
        rooms: {
          where: {
            deletedAt: null,
            branchId: dto.branchId,
          },
          include: {
            roomStays: {
              where: {
                status: { not: RoomStayStatus.CANCELLED },
                AND: [
                  { startDate: { lt: checkOutDate } },
                  { endDate: { gt: checkInDate } },
                ],
              },
            },
          },
        },
      },
    });

    if (!roomType) {
      throw new BadRequestException('Room type not found');
    }

    // Find first available room
    const availableRoom = roomType.rooms.find(
      (room) => room.roomStays.length === 0,
    );

    if (!availableRoom) {
      throw new BadRequestException(
        'No rooms available for the selected dates',
      );
    }

    // Use a transaction to prevent race conditions
    return this.prisma.$transaction(async (tx) => {
      // Double-check availability with pessimistic locking approach
      const conflictingStays = await tx.roomStay.findMany({
        where: {
          roomId: availableRoom.id,
          status: { not: RoomStayStatus.CANCELLED },
          AND: [
            { startDate: { lt: checkOutDate } },
            { endDate: { gt: checkInDate } },
          ],
        },
      });

      if (conflictingStays.length > 0) {
        throw new BadRequestException(
          'Room was just booked by another user. Please try again.',
        );
      }

      // Create or find guest
      let guest = await tx.guest.findFirst({
        where: {
          tenantId,
          passportSeries: dto.passportSeries,
          passportNumber: dto.passportNumber,
        },
      });

      if (!guest) {
        guest = await tx.guest.create({
          data: {
            tenantId,
            branchId: dto.branchId,
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
            email: dto.email,
            citizenship: dto.citizenship,
            passportSeries: dto.passportSeries,
            passportNumber: dto.passportNumber,
            dateOfBirth: new Date(dto.dateOfBirth),
            gender: dto.gender as Gender,
            telegramUserId: dto.telegramUserId,
            telegramUsername: dto.telegramUsername,
            telegramPhone: dto.telegramPhone,
          },
        });
      } else {
        // Update guest telegram info if provided
        guest = await tx.guest.update({
          where: { id: guest.id },
          data: {
            telegramUserId: dto.telegramUserId || guest.telegramUserId,
            telegramUsername: dto.telegramUsername || guest.telegramUsername,
            telegramPhone: dto.telegramPhone || guest.telegramPhone,
          },
        });
      }

      // Calculate daily rate
      const dailyRate = roomType.basePrice;
      const nights = Math.ceil(
        (checkOutDate.getTime() - checkInDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      // Create booking
      const booking = await tx.booking.create({
        data: {
          tenantId,
          branchId: dto.branchId,
          primaryGuestId: guest.id,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          status: BookingStatus.CONFIRMED,
          source: BookingSource.TELEGRAM,
          telegramUserId: dto.telegramUserId,
          telegramUsername: dto.telegramUsername,
          telegramPhone: dto.telegramPhone,
          roomStays: {
            create: {
              tenantId,
              roomId: availableRoom.id,
              startDate: checkInDate,
              endDate: checkOutDate,
              dailyRate,
              adultsCount: dto.adultsCount || 1,
              childrenCount: dto.childrenCount || 0,
              status: RoomStayStatus.RESERVED,
            },
          },
        },
        include: {
          roomStays: {
            include: {
              room: true,
            },
          },
          primaryGuest: true,
        },
      });

      // Create primary folio
      await tx.folio.create({
        data: {
          tenantId,
          branchId: dto.branchId,
          bookingId: booking.id,
          isPrimary: true,
        },
      });

      return {
        success: true,
        bookingId: booking.id,
        confirmationNumber: booking.id.substring(0, 8).toUpperCase(),
        hotel: branch.name,
        room: `${availableRoom.number} (${roomType.name})`,
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString(),
        nights,
        totalAmount: Number(dailyRate) * nights,
        currency: branch.currency,
        guest: `${guest.firstName} ${guest.lastName}`,
      };
    });
  }

  /**
   * Get all bookings for a user by their Telegram ID
   */
  async getUserBookings(telegramUserId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: {
        telegramUserId,
        deletedAt: null,
      },
      include: {
        branch: true,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return (bookings as any[]).map((booking) => {
      const roomStay = booking.roomStays[0];
      return {
        id: booking.id,
        confirmationNumber: booking.id.substring(0, 8).toUpperCase(),
        hotelName: booking.branch.name,
        address: booking.branch.address,
        latitude: booking.branch.latitude,
        longitude: booking.branch.longitude,
        checkIn: booking.checkIn.toISOString(),
        checkOut: booking.checkOut.toISOString(),
        status: booking.status,
        roomName: roomStay?.room?.type.name || 'N/A',
        roomNumber: roomStay?.room?.number || 'TBD',
        totalAmount: booking.roomStays.reduce(
          (sum, rs) => sum + Number(rs.dailyRate),
          0,
        ),
        currency: booking.branch.currency,
      };
    });
  }

  /**
   * Cancel a booking (from Telegram or website)
   */
  async cancelPublicBooking(bookingId: string, telegramUserId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        id: bookingId,
        telegramUserId,
        deletedAt: null,
      },
    });

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException(
        `Booking cannot be cancelled in status: ${booking.status}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Update booking status
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CANCELLED },
      });

      // Update all associated room stays
      await tx.roomStay.updateMany({
        where: { bookingId },
        data: { status: RoomStayStatus.CANCELLED },
      });

      return {
        success: true,
        bookingId: updatedBooking.id,
        status: updatedBooking.status,
      };
    });
  }
}
