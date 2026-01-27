import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto.js';
import { getTenantContext } from '../common/tenant-context.js';

@Injectable()
export class BranchService {
  constructor(private prisma: PrismaService) {}

  private getContext() {
    return getTenantContext();
  }

  async create(dto: CreateBranchDto) {
    const context = this.getContext();
    const tenantId = context?.tenantId;

    if (!tenantId) throw new BadRequestException('Tenant context required');

    // Check branch limit
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { branches: true },
    });

    if (tenant && tenant.branches.length >= tenant.maxBranches) {
      throw new BadRequestException(
        `Branch limit reached (Max: ${tenant.maxBranches})`,
      );
    }

    return this.prisma.branch.create({
      data: {
        ...dto,
        tenantId,
      },
    });
  }

  // If tenantId is provided (by Super Admin), use it. Otherwise use context.
  async findAll(tenantId?: string) {
    const context = this.getContext();
    const targetTenantId = tenantId || context?.tenantId;

    if (!targetTenantId) {
      // Super Admin without specifier might want ALL branches? Or maybe not.
      // Let's enforce tenant specifier for now or empty list if no context.
      return [];
    }

    return this.prisma.branch.findMany({
      where: { tenantId: targetTenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const context = this.getContext();
    const tenantId = context?.tenantId;

    // If tenantId is present in context, restrict access.
    // If SUPER_ADMIN (no tenant context sometimes?), we might need to handle differently.
    // But usually SUPER_ADMIN context middleware might set tenantId if x-tenant-id passed, or not.
    // Let's assume standard security: context matters.

    const whereClause: any = { id };
    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    const branch = await this.prisma.branch.findFirst({
      where: whereClause,
    });

    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  async update(id: string, dto: UpdateBranchDto) {
    const branch = await this.findOne(id); // Ensures ownership check via findOne

    return this.prisma.branch.update({
      where: { id: branch.id },
      data: dto,
    });
  }

  async remove(id: string) {
    const branch = await this.findOne(id); // Ensures ownership check

    // Check if branch has usage (rooms, bookings, etc)
    // For simplicity, maybe just set inactive or soft delete logic if complex relations exists.
    // Prisma might throw error on Foreign Key constraint.

    // Let's try delete, if fails, user gets error.
    try {
      return await this.prisma.branch.delete({
        where: { id: branch.id },
      });
    } catch (error) {
      throw new BadRequestException(
        'Cannot delete branch with existing data. Try deactivating it instead.',
      );
    }
  }
}
