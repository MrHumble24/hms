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
import { HousekeepingService } from './housekeeping.service.js';
import {
  CreateHousekeepingTaskDto,
  UpdateHousekeepingTaskDto,
} from './dto/housekeeping.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

import { BranchAccessGuard } from '../auth/guards/branch-access.guard.js';

@Controller('housekeeping')
@UseGuards(JwtAuthGuard, RolesGuard, BranchAccessGuard)
export class HousekeepingController {
  constructor(private readonly housekeepingService: HousekeepingService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST')
  create(@Body() dto: CreateHousekeepingTaskDto, @Request() req: any) {
    return this.housekeepingService.create(dto, req.user.id);
  }

  @Get()
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ) {
    return this.housekeepingService.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      search,
      status,
      priority,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.housekeepingService.findOne(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'MANAGER', 'HOUSEKEEPER')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateHousekeepingTaskDto,
    @Request() req: any,
  ) {
    return this.housekeepingService.update(id, dto, req.user.id);
  }

  @Post('room-status')
  @Roles('SUPER_ADMIN', 'MANAGER', 'HOUSEKEEPER')
  updateRoomStatus(
    @Body()
    body: {
      roomId: string;
      status: any;
      userId: string;
      notes?: string;
    },
  ) {
    return this.housekeepingService.updateRoomStatus(
      body.roomId,
      body.status,
      body.userId,
      body.notes,
    );
  }
}
