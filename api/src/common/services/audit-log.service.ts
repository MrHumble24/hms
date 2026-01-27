import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { getTenantContext } from '../tenant-context.js';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    action: string;
    entity: string;
    entityId: string;
    oldValue?: any;
    newValue?: any;
    userAgent?: string;
    ipAddress?: string;
  }) {
    const context = getTenantContext();
    if (!context?.tenantId) return;

    return this.prisma.auditLog.create({
      data: {
        action: params.action as any,
        entityType: params.entity,
        entityId: params.entityId,
        oldData: params.oldValue,
        newData: params.newValue,
        userAgent: params.userAgent,
        ipAddress: params.ipAddress,
        userId: context.userId,
        tenantId: context.tenantId,
      },
    });
  }
}
