import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { getTenantContext } from '../common/tenant-context.js';

@Injectable()
export class EmehmonService {
  constructor(private prisma: PrismaService) {}

  private getContext() {
    const context = getTenantContext();
    if (!context?.branchId || !context?.tenantId) {
      throw new BadRequestException('Tenant and Branch context are required');
    }
    return context;
  }

  async registerGuest(bookingId: string) {
    const { branchId, tenantId } = this.getContext();

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId, branchId, tenantId },
      include: {
        primaryGuest: true,
        roomStays: { include: { room: true } },
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    const guest = booking.primaryGuest;
    const roomNumber = booking.roomStays[0]?.room?.number || 'UNKNOWN';

    // Validate Mandatory Fields for E-Mehmon
    const missingFields: string[] = [];
    if (!guest.citizenship) missingFields.push('citizenship');
    if (!guest.passportSeries) missingFields.push('passportSeries');
    if (!guest.passportNumber) missingFields.push('passportNumber');
    if (!guest.dateOfBirth) missingFields.push('dateOfBirth');

    if (missingFields.length > 0) {
      throw new BadRequestException(
        `Missing mandatory E-Mehmon fields: ${missingFields.join(', ')}`,
      );
    }

    // Mock External API Request
    const requestPayload = {
      passport: `${guest.passportSeries}${guest.passportNumber}`,
      citizenship: guest.citizenship,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      room: roomNumber,
    };

    // Simulate API Call
    const success = Math.random() > 0.2; // 80% success rate
    const responsePayload = success
      ? {
          success: true,
          regId: `REG-${Date.now()}`,
          slipUrl: 'https://emehmon.uz/slips/dummy.pdf',
        }
      : { success: false, error: 'External API Error: Timeout' };

    // Log the attempt
    const log = await this.prisma.emehmonLog.create({
      data: {
        tenantId,
        guestId: guest.id,
        bookingId: booking.id,
        status: success ? 'SUCCESS' : 'FAILED',
        requestJson: requestPayload as any,
        responseJson: responsePayload as any,
        regSlipUrl: success ? responsePayload.slipUrl : null,
      },
    });

    return log;
  }

  async getLogsByBooking(bookingId: string) {
    const { branchId, tenantId } = this.getContext();

    // Verify booking belongs to this branch
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId, branchId, tenantId },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    return this.prisma.emehmonLog.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
