import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { getTenantContext } from '../tenant-context.js';
import {
  CommunicationType,
  CommunicationChannel,
  CommunicationStatus,
} from '@prisma/client';

@Injectable()
export class GuestCommunicationService {
  constructor(private prisma: PrismaService) {}

  async logCommunication(params: {
    guestId: string;
    bookingId?: string;
    type: CommunicationType;
    channel: CommunicationChannel;
    subject?: string;
    content: string;
    metadata?: any;
  }) {
    const context = getTenantContext();
    if (!context?.tenantId) {
      throw new BadRequestException('Tenant context is required');
    }
    const { tenantId } = context;

    return this.prisma.guestCommunication.create({
      data: {
        ...params,
        tenantId,
        status: CommunicationStatus.SENT,
      },
    });
  }
}
