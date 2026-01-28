import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateCommunicationDto,
  UpdateCommunicationStatusDto,
  QueryCommunicationsDto,
} from './dto/communications.dto.js';
import { CommunicationStatus } from '@prisma/client';
import { getTenantContext } from '../common/tenant-context.js';

@Injectable()
export class CommunicationsService {
  constructor(private prisma: PrismaService) {}

  private getContext() {
    const context = getTenantContext();
    if (!context?.tenantId || !context?.branchId) {
      throw new BadRequestException('Tenant and Branch context are required');
    }
    return context;
  }

  async create(dto: CreateCommunicationDto) {
    const { tenantId } = this.getContext();

    // Verify guest exists
    const guest = await this.prisma.guest.findFirst({
      where: { id: dto.guestId, tenantId },
    });
    if (!guest) throw new NotFoundException('Guest not found');

    // Verify booking if provided
    if (dto.bookingId) {
      const booking = await this.prisma.booking.findFirst({
        where: { id: dto.bookingId, tenantId },
      });
      if (!booking) throw new NotFoundException('Booking not found');
    }

    return this.prisma.guestCommunication.create({
      data: {
        tenantId,
        guestId: dto.guestId,
        bookingId: dto.bookingId,
        type: dto.type,
        channel: dto.channel,
        subject: dto.subject,
        content: dto.content,
        status: CommunicationStatus.PENDING,
      },
      include: {
        guest: true,
        booking: true,
      },
    });
  }

  async findAll(query?: QueryCommunicationsDto) {
    const { tenantId, branchId } = this.getContext();

    const where: any = { tenantId };

    // Filter by booking's branch if booking exists
    where.OR = [
      { booking: { branchId: branchId } },
      { booking: null }, // Include communications without bookings (guest-level)
    ];

    if (query?.guestId) where.guestId = query.guestId;
    if (query?.bookingId) where.bookingId = query.bookingId;
    if (query?.type) where.type = query.type;
    if (query?.channel) where.channel = query.channel;
    if (query?.status) where.status = query.status;

    return this.prisma.guestCommunication.findMany({
      where,
      include: {
        guest: {
          select: { firstName: true, lastName: true, email: true, phone: true },
        },
        booking: {
          select: { id: true, checkIn: true, checkOut: true, branchId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const { tenantId } = this.getContext();

    const communication = await this.prisma.guestCommunication.findFirst({
      where: { id, tenantId },
      include: {
        guest: true,
        booking: true,
      },
    });

    if (!communication) throw new NotFoundException('Communication not found');
    return communication;
  }

  async findByGuest(guestId: string) {
    const { tenantId } = this.getContext();

    // Verify guest exists
    const guest = await this.prisma.guest.findFirst({
      where: { id: guestId, tenantId },
    });
    if (!guest) throw new NotFoundException('Guest not found');

    return this.prisma.guestCommunication.findMany({
      where: { guestId, tenantId },
      include: {
        booking: { select: { id: true, checkIn: true, checkOut: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByBooking(bookingId: string) {
    const { tenantId, branchId } = this.getContext();

    // Verify booking exists and belongs to this branch
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, tenantId, branchId },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    return this.prisma.guestCommunication.findMany({
      where: { bookingId, tenantId },
      include: {
        guest: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, dto: UpdateCommunicationStatusDto) {
    const { tenantId } = this.getContext();

    const communication = await this.findOne(id);

    const updateData: any = { status: dto.status };

    // Set timestamps based on status
    if (dto.status === CommunicationStatus.SENT) {
      updateData.sentAt = new Date();
    } else if (dto.status === CommunicationStatus.DELIVERED) {
      updateData.deliveredAt = new Date();
    } else if (dto.status === CommunicationStatus.OPENED) {
      updateData.openedAt = new Date();
    }

    return this.prisma.guestCommunication.update({
      where: { id },
      data: updateData,
      include: { guest: true, booking: true },
    });
  }

  // Helper method to send common communication types
  async sendBookingConfirmation(bookingId: string) {
    const { tenantId, branchId } = this.getContext();

    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, tenantId, branchId },
      include: {
        primaryGuest: true,
        roomStays: { include: { room: { include: { type: true } } } },
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    const guest = booking.primaryGuest;
    const roomInfo = booking.roomStays
      .map((rs) => rs.room?.type?.name || 'Room')
      .join(', ');

    const content = `Dear ${guest.firstName},\n\nYour booking has been confirmed!\n\nCheck-in: ${booking.checkIn.toDateString()}\nCheck-out: ${booking.checkOut.toDateString()}\nRooms: ${roomInfo}\n\nWe look forward to welcoming you!`;

    return this.create({
      guestId: guest.id,
      bookingId: booking.id,
      type: 'BOOKING_CONFIRMATION',
      channel: guest.email ? 'EMAIL' : 'SMS',
      subject: 'Booking Confirmation',
      content,
    });
  }
}
