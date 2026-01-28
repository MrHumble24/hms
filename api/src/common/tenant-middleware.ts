import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { tenantContextStorage } from './tenant-context.js';
import { PrismaService } from '../prisma/prisma.service.js';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    let tenantId = req.headers['x-tenant-id'] as string;
    let branchId = req.headers['x-branch-id'] as string;

    console.log(
      '📥 Incoming headers - tenantId:',
      tenantId,
      'branchId:',
      branchId,
    );

    // Fallback to JWT if headers are missing
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.decode(token) as any;
        const isSuperAdmin = decoded?.role === 'SUPER_ADMIN';
        const userRole = decoded?.role;
        const userId = decoded?.sub;

        // Get tenantId from JWT if not in header
        if (decoded?.tenantId && !tenantId) {
          tenantId = decoded.tenantId;
        }

        // For non-super-admin, ensure tenantId matches JWT
        if (
          !isSuperAdmin &&
          decoded?.tenantId &&
          tenantId !== decoded.tenantId
        ) {
          tenantId = decoded.tenantId;
        }

        // Get default branchId from JWT only if header is missing
        if (!branchId && decoded?.branchIds?.length > 0) {
          branchId = decoded.branchIds[0];
        }

        (req as any)._userRole = userRole;
        (req as any)._userId = userId;
      } catch (e) {
        // Ignore decode errors
      }
    }

    // Validate tenant if we have an ID
    if (tenantId) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, isActive: true },
      });

      if (!tenant || !tenant.isActive) {
        throw new BadRequestException(
          'Account or organization is suspended. Please contact support.',
        );
      }

      // If branchId is still missing, fallback to the first branch of this tenant
      if (!branchId) {
        const firstBranch = await this.prisma.branch.findFirst({
          where: { tenantId, isActive: true },
          orderBy: { createdAt: 'asc' },
          select: { id: true },
        });
        if (firstBranch) {
          branchId = firstBranch.id;
        }
      }
    }

    // Validate branch belongs to tenant (database validation, not JWT)
    if (tenantId && branchId) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: branchId },
        select: { id: true, tenantId: true, isActive: true },
      });

      if (!branch || branch.tenantId !== tenantId || !branch.isActive) {
        console.log(
          '⚠️ Branch validation failed, falling back to first branch',
        );
        // Fallback if branch is invalid for this tenant
        const firstBranch = await this.prisma.branch.findFirst({
          where: { tenantId, isActive: true },
          orderBy: { createdAt: 'asc' },
          select: { id: true },
        });
        branchId = firstBranch?.id || branchId;
      }
    }

    console.log(
      '✅ Final context - tenantId:',
      tenantId,
      'branchId:',
      branchId,
    );

    tenantContextStorage.run(
      {
        tenantId: tenantId,
        branchId: branchId,
        userId: (req as any)._userId,
        userRole: (req as any)._userRole,
      },
      () => {
        next();
      },
    );
  }
}
