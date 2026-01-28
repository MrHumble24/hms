import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SubscriptionStatus, PlanType, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export class UpdateSubscriptionDto {
  subscriptionStatus?: SubscriptionStatus;
  subscriptionStart?: Date;
  subscriptionEnd?: Date;
  planType?: PlanType;
  maxBranches?: number;
  maxUsers?: number;
  lastPaymentDate?: Date;
  nextBillingDate?: Date;
  notes?: string;
}

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getAllTenants(params?: {
    skip?: number;
    take?: number;
    status?: 'active' | 'inactive';
    search?: string;
  }) {
    const where: any = {};

    if (params?.status) {
      where.isActive = params.status === 'active';
    }

    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { slug: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip: params?.skip || 0,
        take: params?.take || 50,
        include: {
          _count: {
            select: {
              branches: true,
              users: true,
              guests: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return { tenants, total };
  }

  async createTenant(data: {
    name: string;
    slug: string;
    email: string;
    fullName: string;
    password: string;
    planType: string;
  }) {
    // Check if slug exists
    const existing = await this.prisma.tenant.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new Error('Tenant with this slug already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(data.password, salt);

    // Create Tenant, Branch, and Admin User in a transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: data.name,
          slug: data.slug,
          planType: data.planType as PlanType,
          isActive: true,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          subscriptionStart: new Date(),
          maxBranches: 1, // Default, can be updated later
          maxUsers: 5, // Default
        },
      });

      // 2. Create Default Branch (Main Branch)
      const branch = await tx.branch.create({
        data: {
          name: 'Main Branch',
          tenantId: tenant.id,
          isActive: true,
        },
      });

      // 3. Create Admin User
      const user = await tx.user.create({
        data: {
          email: data.email,
          fullName: data.fullName,
          password: hashedPassword,
          role: Role.ADMIN, // Tenant Admin
          tenantId: tenant.id,
          isActive: true, // Should be active by default
          branches: {
            create: { branchId: branch.id },
          },
        },
      });

      return tenant;
    });
  }

  async getTenant(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        branches: true,
        _count: {
          select: {
            users: true,
            guests: true,
            companies: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async activateTenant(id: string) {
    const tenant = await this.getTenant(id);

    return this.prisma.tenant.update({
      where: { id },
      data: {
        isActive: true,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
      },
    });
  }

  async deactivateTenant(id: string, reason?: string) {
    const tenant = await this.getTenant(id);

    return this.prisma.tenant.update({
      where: { id },
      data: {
        isActive: false,
        subscriptionStatus: SubscriptionStatus.SUSPENDED,
        notes: reason || tenant.notes,
      },
    });
  }

  async updateSubscription(id: string, data: UpdateSubscriptionDto) {
    const tenant = await this.getTenant(id);

    // Ensure numeric fields are properly typed
    const updateData: any = { ...data };
    if (data.maxBranches !== undefined) {
      updateData.maxBranches =
        typeof data.maxBranches === 'string'
          ? parseInt(data.maxBranches, 10)
          : data.maxBranches;
    }
    if (data.maxUsers !== undefined) {
      updateData.maxUsers =
        typeof data.maxUsers === 'string'
          ? parseInt(data.maxUsers, 10)
          : data.maxUsers;
    }

    return this.prisma.tenant.update({
      where: { id },
      data: updateData,
    });
  }

  async getTenantUsageStats(id: string) {
    const tenant = await this.getTenant(id);

    const [branchCount, userCount, guestCount, bookingCount] =
      await Promise.all([
        this.prisma.branch.count({ where: { tenantId: id } }),
        this.prisma.user.count({ where: { tenantId: id } }),
        this.prisma.guest.count({ where: { tenantId: id } }),
        this.prisma.booking.count({
          where: { branch: { tenantId: id } },
        }),
      ]);

    return {
      branches: branchCount,
      users: userCount,
      guests: guestCount,
      bookings: bookingCount,
      limits: {
        maxBranches: tenant.maxBranches,
        maxUsers: tenant.maxUsers,
      },
      usage: {
        branchesUsed: `${branchCount}/${tenant.maxBranches}`,
        usersUsed: `${userCount}/${tenant.maxUsers}`,
      },
    };
  }
  async getTenantUsers(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      include: {
        branches: {
          include: {
            branch: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTenantUser(
    tenantId: string,
    data: { email: string; fullName: string; password: string; role: Role },
  ) {
    const tenant = await this.getTenant(tenantId);

    // Hash password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(data.password, salt);

    // Default to first branch for now
    const branch = tenant.branches[0];

    return this.prisma.user.create({
      data: {
        email: data.email,
        fullName: data.fullName,
        password: hashedPassword,
        role: data.role,
        tenantId: tenant.id,
        branches: branch
          ? {
              create: { branchId: branch.id },
            }
          : undefined,
      },
    });
  }

  // Alias for backward compatibility if needed, or just use createTenantUser with Role.ADMIN
  async createTenantAdmin(
    tenantId: string,
    data: { email: string; fullName: string; password: string },
  ) {
    return this.createTenantUser(tenantId, { ...data, role: Role.ADMIN });
  }

  async deleteTenantUser(tenantId: string, userId: string) {
    // Check if user belongs to tenant
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException('User not found in this tenant');
    }

    // Try hard delete, if fails due to constraints, maybe soft delete?
    // For now, let's try delete
    return this.prisma.user.delete({
      where: { id: userId },
    });
  }
}
