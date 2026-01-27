import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Query,
} from '@nestjs/common';
import { StaffService } from './staff.service.js';
import {
  CreateStaffDto,
  UpdateStaffDto,
  UpdateRoleDto,
} from './dto/staff.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '@prisma/client';

@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST')
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('role') role?: Role,
    @Query('status') status?: string,
  ) {
    return this.staffService.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      search,
      role,
      status,
    });
  }

  @Post()
  @Roles('SUPER_ADMIN', 'MANAGER')
  create(@Body() createStaffDto: CreateStaffDto) {
    return this.staffService.create(createStaffDto);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'MANAGER')
  findOne(@Param('id') id: string) {
    return this.staffService.findOne(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'MANAGER')
  update(@Param('id') id: string, @Body() updateStaffDto: UpdateStaffDto) {
    return this.staffService.update(id, updateStaffDto);
  }

  @Patch(':id/role')
  @Roles('SUPER_ADMIN')
  updateRole(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.staffService.updateRole(id, updateRoleDto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  remove(@Param('id') id: string) {
    return this.staffService.remove(id);
  }

  @Get(':id/branches')
  @Roles('SUPER_ADMIN', 'MANAGER')
  getUserBranches(@Param('id') id: string) {
    return this.staffService.getUserBranches(id);
  }

  @Post(':id/branches')
  @Roles('SUPER_ADMIN', 'MANAGER')
  assignBranches(
    @Param('id') id: string,
    @Body() body: { branchIds: string[] },
  ) {
    return this.staffService.assignBranches(id, body.branchIds);
  }
}
