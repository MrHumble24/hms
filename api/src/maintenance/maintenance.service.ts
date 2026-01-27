import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateMaintenanceTicketDto,
  UpdateMaintenanceTicketDto,
} from './dto/maintenance.dto.js';
import { RoomStatus } from '@prisma/client';
import { getTenantContext } from '../common/tenant-context.js';

@Injectable()
export class MaintenanceService {
  constructor(private prisma: PrismaService) {}

  private getContext() {
    const context = getTenantContext();
    if (!context?.branchId) {
      throw new BadRequestException('Branch context is required');
    }
    return context;
  }

  async create(dto: CreateMaintenanceTicketDto, staffId: string) {
    const { branchId, tenantId } = this.getContext();

    // Verify room exists in this branch
    const room = await this.prisma.room.findUnique({
      where: { id: dto.roomId, branchId, tenantId },
    });
    if (!room) throw new NotFoundException('Room not found in this branch');

    await this.prisma.room.update({
      where: { id: dto.roomId, branchId, tenantId },
      data: { status: RoomStatus.MAINTENANCE },
    });

    return this.prisma.maintenanceTicket.create({
      data: {
        ...dto,
        tenantId,
        reportedBy: staffId,
      },
      include: { room: true },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    search?: string;
    status?: string;
    priority?: string;
  }) {
    const { branchId, tenantId } = this.getContext();
    const where: any = {
      tenantId,
      room: { branchId },
    };

    if (params.status && params.status !== 'ALL') {
      where.status = params.status;
    }

    if (params.priority && params.priority !== 'ALL') {
      where.priority = params.priority;
    }

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
        { room: { number: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.maintenanceTicket.findMany({
        where,
        skip: params.skip || 0,
        take: params.take || 10,
        include: { room: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.maintenanceTicket.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(id: string) {
    const { branchId, tenantId } = this.getContext();
    const ticket = await this.prisma.maintenanceTicket.findFirst({
      where: {
        id,
        tenantId,
        room: { branchId },
      },
      include: { room: true },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async update(id: string, dto: UpdateMaintenanceTicketDto) {
    const { branchId } = this.getContext();
    const ticket = await this.findOne(id);

    if (dto.status === 'RESOLVED') {
      const { branchId, tenantId } = this.getContext();
      await this.prisma.room.update({
        where: { id: ticket.roomId, branchId, tenantId },
        data: { status: RoomStatus.DIRTY },
      });
    }

    const { tenantId } = this.getContext();
    return this.prisma.maintenanceTicket.update({
      where: { id, tenantId },
      data: dto,
      include: { room: true },
    });
  }
}
