import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class BranchAccessGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const requestedBranchId = request.headers['x-branch-id'];

    // 1. SUPER_ADMIN has access to everything
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    // 2. ADMIN has access to all branches of their tenant
    if (user.role === 'ADMIN' && user.tenantId) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: requestedBranchId as string },
        select: { tenantId: true, isActive: true },
      });

      if (branch && branch.tenantId === user.tenantId) {
        if (!branch.isActive) {
          throw new ForbiddenException(
            'This branch is currently deactivated. Please contact your administrator.',
          );
        }
        return true;
      }
    }

    // 3. Regular users must be explicitly assigned to the branch
    if (!user.branchIds || !user.branchIds.includes(requestedBranchId)) {
      throw new ForbiddenException(
        `Access denied to branch ${requestedBranchId}. You are not authorized to access this branch.`,
      );
    }

    // Check if branch is active
    const branch = await this.prisma.branch.findUnique({
      where: { id: requestedBranchId as string },
    });

    if (!branch || !branch.isActive) {
      throw new ForbiddenException(
        'This branch is currently deactivated. Please contact your administrator.',
      );
    }

    return true;
  }
}
