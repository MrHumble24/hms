import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto } from './dto/auth.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, fullName } = registerDto;

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // For now, assign to default tenant
    // In production, this would be handled by a tenant creation flow or invitation
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: 'default' },
    });

    if (!tenant) {
      throw new InternalServerErrorException('Default tenant not found');
    }

    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          fullName,
          tenantId: tenant.id,
        },
      });

      (user as any).password = undefined;
      return user;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Email already exists');
      }
      throw new InternalServerErrorException();
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      if (!user.isActive) {
        throw new UnauthorizedException(
          'Your account has been deactivated. Please contact your administrator.',
        );
      }

      if (!user.tenant || !user.tenant.isActive) {
        throw new UnauthorizedException(
          'Your organization is currently deactivated. Please contact support.',
        );
      }
      // Fetch user's authorized branches
      const userBranches = await this.prisma.userBranch.findMany({
        where: { userId: user.id },
        include: { branch: true },
      });

      const branchIds = userBranches.map((ub) => ub.branchId);

      // Enhanced JWT payload with tenant/branch context
      const payload = {
        id: user.id,
        email: user.email,
        tenantId: user.tenantId,
        branchIds,
        role: user.role,
      };
      const accessToken = this.jwtService.sign(payload);

      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          tenantId: user.tenantId,
          branches: userBranches.map((ub) => ({
            id: ub.branch.id,
            name: ub.branch.name,
            address: ub.branch.address,
            isActive: ub.branch.isActive,
          })),
        },
        accessToken,
      };
    }

    throw new UnauthorizedException('Invalid credentials');
  }
}
