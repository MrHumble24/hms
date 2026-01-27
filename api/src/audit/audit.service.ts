import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateAuditLogDto, QueryAuditLogsDto } from './dto/audit.dto.js';
import { AuditAction } from '@prisma/client';
import { getTenantContext } from '../common/tenant-context.js';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  private getContext() {
    const context = getTenantContext();
    if (!context?.tenantId) {
      throw new BadRequestException('Tenant context is required');
    }
    return context;
  }

  /**
   * Create an audit log entry
   */
  async log(dto: CreateAuditLogDto, userId?: string) {
    const { tenantId } = this.getContext();

    return this.prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: dto.action,
        entityType: dto.entityType,
        entityId: dto.entityId,
        oldData: dto.oldData,
        newData: dto.newData,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
      },
    });
  }

  /**
   * Log a CREATE action
   */
  async logCreate(
    entityType: string,
    entityId: string,
    newData: any,
    userId?: string,
    ipAddress?: string,
  ) {
    return this.log(
      {
        action: AuditAction.CREATE,
        entityType,
        entityId,
        newData,
        ipAddress,
      },
      userId,
    );
  }

  /**
   * Log an UPDATE action
   */
  async logUpdate(
    entityType: string,
    entityId: string,
    oldData: any,
    newData: any,
    userId?: string,
    ipAddress?: string,
  ) {
    return this.log(
      {
        action: AuditAction.UPDATE,
        entityType,
        entityId,
        oldData,
        newData,
        ipAddress,
      },
      userId,
    );
  }

  /**
   * Log a DELETE action
   */
  async logDelete(
    entityType: string,
    entityId: string,
    oldData: any,
    userId?: string,
    ipAddress?: string,
  ) {
    return this.log(
      {
        action: AuditAction.DELETE,
        entityType,
        entityId,
        oldData,
        ipAddress,
      },
      userId,
    );
  }

  /**
   * Log a LOGIN action
   */
  async logLogin(userId: string, ipAddress?: string, userAgent?: string) {
    const { tenantId } = this.getContext();

    return this.prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: AuditAction.LOGIN,
        entityType: 'User',
        entityId: userId,
        ipAddress,
        userAgent,
      },
    });
  }

  /**
   * Log a LOGOUT action
   */
  async logLogout(userId: string, ipAddress?: string) {
    const { tenantId } = this.getContext();

    return this.prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: AuditAction.LOGOUT,
        entityType: 'User',
        entityId: userId,
        ipAddress,
      },
    });
  }

  /**
   * Query audit logs with filters
   */
  async findAll(query?: QueryAuditLogsDto) {
    const { tenantId } = this.getContext();

    const where: any = { tenantId };

    if (query?.userId) where.userId = query.userId;
    if (query?.action) where.action = query.action;
    if (query?.entityType) where.entityType = query.entityType;
    if (query?.entityId) where.entityId = query.entityId;

    if (query?.startDate || query?.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, fullName: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: query?.skip ? Number(query.skip) : 0,
        take: query?.take ? Number(query.take) : 50,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data: logs, total };
  }

  /**
   * Get audit logs for a specific entity
   */
  async findByEntity(entityType: string, entityId: string) {
    const { tenantId } = this.getContext();

    return this.prisma.auditLog.findMany({
      where: {
        tenantId,
        entityType,
        entityId,
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get audit logs for a specific user
   */
  async findByUser(userId: string) {
    const { tenantId } = this.getContext();

    return this.prisma.auditLog.findMany({
      where: {
        tenantId,
        userId,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Get recent activity summary
   */
  async getRecentActivity(limit: number = 20) {
    const { tenantId } = this.getContext();

    return this.prisma.auditLog.findMany({
      where: { tenantId },
      include: {
        user: {
          select: { fullName: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
