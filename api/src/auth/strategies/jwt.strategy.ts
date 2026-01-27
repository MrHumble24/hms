import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super-secret-hms-key',
    });
  }

  async validate(payload: {
    id: string;
    email: string;
    tenantId: string;
    branchIds: string[];
    role: string;
  }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.id },
      include: {
        tenant: true,
        branches: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is inactive or not found');
    }

    if (!user.tenant || !user.tenant.isActive) {
      throw new UnauthorizedException(
        'Tenant is inactive. Please contact support.',
      );
    }

    // Attach additional context to request.user
    return {
      ...user,
      branchIds: user.branches.map((b) => b.branchId),
    };
  }
}
