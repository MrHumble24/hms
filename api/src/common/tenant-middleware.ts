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

    // Fallback to JWT if headers are missing or mismatch (prevents stale headers from blocking users)
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.decode(token) as any;
        const isSuperAdmin = decoded?.role === 'SUPER_ADMIN';

        if (decoded?.tenantId) {
          // If SUPER_ADMIN, they can override tenantId with header
          // Otherwise, if header is missing OR different from JWT, trust the JWT
          if (!isSuperAdmin) {
            if (!tenantId || tenantId !== decoded.tenantId) {
              tenantId = decoded.tenantId;
            }
          } else if (!tenantId) {
            // Even Super Admin needs a default if no header
            tenantId = decoded.tenantId;
          }
        }

        if (
          decoded?.branchIds &&
          Array.isArray(decoded.branchIds) &&
          decoded.branchIds.length > 0
        ) {
          // If SUPER_ADMIN, they can override branchId with header
          // Otherwise, if branch header is missing or not in the user's allowed list, fallback to primary branch
          if (!isSuperAdmin) {
            if (!branchId || !decoded.branchIds.includes(branchId)) {
              branchId = decoded.branchIds[0];
            }
          } else if (!branchId) {
            // Fallback for Super Admin if no branch header
            branchId = decoded.branchIds[0];
          }
        }
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

    // Validate branch if we have both
    if (tenantId && branchId) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: branchId },
        select: { id: true, tenantId: true },
      });

      if (!branch || branch.tenantId !== tenantId) {
        // Fallback if branch is invalid for this tenant
        const firstBranch = await this.prisma.branch.findFirst({
          where: { tenantId, isActive: true },
          orderBy: { createdAt: 'asc' },
          select: { id: true },
        });
        branchId = firstBranch?.id || (branchId as any); // Cast as last resort to avoid throw
      }
    }

    tenantContextStorage.run({ tenantId: tenantId, branchId: branchId }, () => {
      next();
    });
  }
}
