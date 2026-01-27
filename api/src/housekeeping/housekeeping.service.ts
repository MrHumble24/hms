import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateHousekeepingTaskDto,
  UpdateHousekeepingTaskDto,
} from './dto/housekeeping.dto.js';
import { RoomStatus, TaskStatus } from '@prisma/client';
import { getTenantContext } from '../common/tenant-context.js';

@Injectable()
export class HousekeepingService {
  constructor(private prisma: PrismaService) {}

  private getContext() {
    const context = getTenantContext();
    if (!context?.branchId || !context?.tenantId) {
      throw new BadRequestException('Tenant and Branch context are required');
    }
    return context;
  }

  async create(dto: CreateHousekeepingTaskDto, createdById: string) {
    const { branchId, tenantId } = this.getContext();

    // Verify room exists in this branch
    const room = await this.prisma.room.findUnique({
      where: { id: dto.roomId, tenantId },
    });
    if (!room) throw new NotFoundException('Room not found in this branch');

    return this.prisma.housekeepingTask.create({
      data: {
        ...dto,
        tenantId,
        createdById,
        scheduledFor: dto.scheduledFor
          ? new Date(dto.scheduledFor)
          : new Date(),
      },
      include: { room: true, assignee: true, createdBy: true },
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
        { notes: { contains: params.search, mode: 'insensitive' } },
        { room: { number: { contains: params.search, mode: 'insensitive' } } },
        {
          assignee: {
            fullName: { contains: params.search, mode: 'insensitive' },
          },
        },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.housekeepingTask.findMany({
        where,
        skip: params.skip || 0,
        take: params.take || 10,
        include: { room: true, assignee: true, createdBy: true },
        orderBy: { scheduledFor: 'desc' },
      }),
      this.prisma.housekeepingTask.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(id: string) {
    const { branchId, tenantId } = this.getContext();
    const task = await this.prisma.housekeepingTask.findFirst({
      where: {
        id,
        tenantId,
        room: { branchId },
      },
      include: { room: true, assignee: true, createdBy: true },
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async update(id: string, dto: UpdateHousekeepingTaskDto, staffId: string) {
    const { branchId, tenantId } = this.getContext();
    const task = await this.findOne(id);

    const updateData: any = { ...dto };

    if (
      dto.status === TaskStatus.COMPLETED &&
      task.status !== TaskStatus.COMPLETED
    ) {
      updateData.completedAt = new Date();
      updateData.completerId = staffId;

      const room = await this.prisma.room.findUnique({
        where: { id: task.roomId, branchId, tenantId },
      });

      if (room) {
        await this.prisma.roomStatusHistory.create({
          data: {
            roomId: task.roomId,
            tenantId,
            oldStatus: room.status,
            newStatus: RoomStatus.CLEAN,
            userId: staffId,
            notes: dto.notes || 'Task Completed',
          },
        });

        await this.prisma.room.update({
          where: { id: task.roomId, branchId, tenantId },
          data: {
            status: RoomStatus.CLEAN,
            lastCleanedAt: new Date(),
          },
        });
      }
    }

    return this.prisma.housekeepingTask.update({
      where: { id },
      data: updateData,
      include: { room: true, assignee: true },
    });
  }

  async updateRoomStatus(
    roomId: string,
    status: RoomStatus,
    userId: string,
    notes?: string,
  ) {
    const { branchId, tenantId } = this.getContext();
    const room = await this.prisma.room.findUnique({
      where: { id: roomId, branchId, tenantId },
    });
    if (!room) throw new NotFoundException('Room not found');

    await this.prisma.roomStatusHistory.create({
      data: {
        roomId,
        tenantId,
        oldStatus: room.status,
        newStatus: status,
        userId,
        notes,
      },
    });

    return this.prisma.room.update({
      where: { id: roomId, branchId, tenantId },
      data: { status },
    });
  }
}
