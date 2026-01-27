import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { MaintenanceService } from './maintenance.service.js';
import {
  CreateMaintenanceTicketDto,
  UpdateMaintenanceTicketDto,
} from './dto/maintenance.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('maintenance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST', 'MAINTENANCE')
  create(@Body() dto: CreateMaintenanceTicketDto, @Request() req: any) {
    return this.maintenanceService.create(dto, req.user.id);
  }

  @Get()
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ) {
    return this.maintenanceService.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      search,
      status,
      priority,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.maintenanceService.findOne(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'MANAGER', 'MAINTENANCE')
  update(@Param('id') id: string, @Body() dto: UpdateMaintenanceTicketDto) {
    return this.maintenanceService.update(id, dto);
  }
}
