import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService, UpdateSubscriptionDto } from './admin.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('tenants')
  createTenant(
    @Body()
    body: {
      name: string;
      slug: string;
      email: string;
      fullName: string;
      password: string;
      planType: string;
    },
  ) {
    return this.adminService.createTenant(body);
  }

  @Get('tenants')
  getAllTenants(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('status') status?: 'active' | 'inactive',
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllTenants({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      status,
      search,
    });
  }

  @Get('tenants/:id')
  getTenant(@Param('id') id: string) {
    return this.adminService.getTenant(id);
  }

  @Get('tenants/:id/usage')
  getTenantUsage(@Param('id') id: string) {
    return this.adminService.getTenantUsageStats(id);
  }

  @Patch('tenants/:id/activate')
  activateTenant(@Param('id') id: string) {
    return this.adminService.activateTenant(id);
  }

  @Patch('tenants/:id/deactivate')
  deactivateTenant(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.adminService.deactivateTenant(id, body.reason);
  }

  @Patch('tenants/:id/subscription')
  updateSubscription(
    @Param('id') id: string,
    @Body()
    body: UpdateSubscriptionDto,
  ) {
    return this.adminService.updateSubscription(id, {
      ...body,
      subscriptionStart: body.subscriptionStart
        ? new Date(body.subscriptionStart)
        : undefined,
      subscriptionEnd: body.subscriptionEnd
        ? new Date(body.subscriptionEnd)
        : undefined,
      lastPaymentDate: body.lastPaymentDate
        ? new Date(body.lastPaymentDate)
        : undefined,
      nextBillingDate: body.nextBillingDate
        ? new Date(body.nextBillingDate)
        : undefined,
      maxBranches: body.maxBranches,
      maxUsers: body.maxUsers,
      planType: body.planType,
      subscriptionStatus: body.subscriptionStatus,
      notes: body.notes,
    });
  }

  @Post('tenants/:id/users/admin')
  createTenantAdmin(
    @Param('id') id: string,
    @Body() body: { email: string; fullName: string; password: string },
  ) {
    return this.adminService.createTenantAdmin(id, body);
  }

  @Get('tenants/:id/users')
  getTenantUsers(@Param('id') id: string) {
    return this.adminService.getTenantUsers(id);
  }

  @Post('tenants/:id/users')
  createTenantUser(
    @Param('id') id: string,
    @Body()
    body: {
      email: string;
      fullName: string;
      password: string;
      role: Role;
    },
  ) {
    return this.adminService.createTenantUser(id, body);
  }

  @Delete('tenants/:id/users/:userId')
  deleteTenantUser(@Param('id') id: string, @Param('userId') userId: string) {
    return this.adminService.deleteTenantUser(id, userId);
  }
}
