import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateStaffDto,
  UpdateStaffDto,
  UpdateRoleDto,
} from './dto/staff.dto.js';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { getTenantContext } from '../common/tenant-context.js';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  private getContext() {
    const context = getTenantContext();
    if (!context?.tenantId || !context?.branchId) {
      throw new BadRequestException('Tenant and Branch context are required');
    }
    return context;
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    search?: string;
    role?: Role;
    status?: string;
  }) {
    const { tenantId, branchId } = this.getContext();

    // Find users who have access to the current branch
    const where: any = {
      tenantId,
      branches: {
        some: {
          branchId: branchId,
        },
      },
    };

    if (params.role) {
      where.role = params.role;
    }

    if (params.status && params.status !== 'ALL') {
      where.isActive = params.status === 'ACTIVE';
    }

    if (params.search) {
      where.OR = [
        { fullName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: params.skip || 0,
        take: params.take || 10,
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          isActive: true,
          createdAt: true,
          branches: {
            include: { branch: true },
          },
        },
        orderBy: { fullName: 'asc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total };
  }

  async create(createStaffDto: CreateStaffDto) {
    const { tenantId, branchId } = this.getContext();

    const existing = await this.prisma.user.findUnique({
      where: { email: createStaffDto.email },
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createStaffDto.password, salt);

    // Create user and assign to current branch
    const user = await this.prisma.user.create({
      data: {
        email: createStaffDto.email,
        password: hashedPassword,
        fullName: createStaffDto.fullName,
        role: createStaffDto.role,
        tenantId,
        isActive: true,
        branches: {
          create: {
            branchId: branchId,
            isDefault: true,
          },
        },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        branches: {
          include: { branch: true },
        },
      },
    });

    return user;
  }

  async findOne(id: string) {
    const { tenantId } = this.getContext();
    const user = await this.prisma.user.findUnique({
      where: { id, tenantId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        tasksAssigned: { take: 10, orderBy: { scheduledFor: 'desc' } },
        maintenanceTickets: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!user) throw new NotFoundException('Staff member not found');
    return user;
  }

  async update(id: string, updateStaffDto: UpdateStaffDto) {
    const { tenantId } = this.getContext();
    await this.findOne(id);

    if (updateStaffDto.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: updateStaffDto.email },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Email already in use');
      }
    }

    return this.prisma.user.update({
      where: { id, tenantId },
      data: updateStaffDto,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    });
  }

  async updateRole(id: string, updateRoleDto: UpdateRoleDto) {
    const { tenantId } = this.getContext();
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id, tenantId },
      data: { role: updateRoleDto.role },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    });
  }

  async remove(id: string) {
    const { tenantId } = this.getContext();
    const user = await this.findOne(id);

    if (user.role === Role.SUPER_ADMIN) {
      const adminCount = await this.prisma.user.count({
        where: {
          role: Role.SUPER_ADMIN,
          isActive: true,
          tenantId,
        },
      });
      if (adminCount <= 1) {
        throw new ConflictException(
          'Cannot delete the last active Super Admin',
        );
      }
    }

    return this.prisma.user.update({
      where: { id, tenantId },
      data: { isActive: false },
    });
  }

  // Branch Assignment Methods
  async assignBranches(userId: string, branchIds: string[]) {
    const { tenantId } = this.getContext();

    // Verify user exists and belongs to this tenant
    await this.findOne(userId);

    // Remove existing assignments
    await this.prisma.userBranch.deleteMany({
      where: { userId },
    });

    // Create new assignments
    if (branchIds.length > 0) {
      await this.prisma.userBranch.createMany({
        data: branchIds.map((branchId) => ({
          userId,
          branchId,
        })),
      });
    }

    return this.findOne(userId);
  }

  async getUserBranches(userId: string) {
    const { tenantId } = this.getContext();

    // Verify user exists and belongs to this tenant
    await this.findOne(userId);

    return this.prisma.userBranch.findMany({
      where: { userId },
      include: { branch: true },
    });
  }
}
