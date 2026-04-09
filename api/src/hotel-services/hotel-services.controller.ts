import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { HotelServicesService } from './hotel-services.service.js';
import {
  CreateHotelServiceDto,
  CreateServiceRequestDto,
  UpdateServiceRequestDto,
  UpdateHotelServiceDto,
} from './dto/hotel-services.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

import { Public } from '../auth/decorators/public.decorator.js';

@Controller('hotel-services')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HotelServicesController {
  constructor(private readonly servicesService: HotelServicesService) {}

  // --- Public Guest Endpoints ---

  @Get('public/catalog')
  @Public()
  findPublicServices() {
    return this.servicesService.findAllServices();
  }

  @Post('public/requests')
  @Public()
  createPublicRequest(@Body() dto: CreateServiceRequestDto) {
    return this.servicesService.createRequest(dto);
  }

  @Get('public/requests/room/:roomId')
  @Public()
  getRoomRequests(@Param('roomId') roomId: string) {
    return this.servicesService.findRoomRequests(roomId);
  }

  // --- Catalog ---

  @Post('catalog')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  createService(@Body() dto: CreateHotelServiceDto) {
    return this.servicesService.createService(dto);
  }

  @Get('catalog')
  findAllServices() {
    return this.servicesService.findAllServices();
  }

  @Patch('catalog/:id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  updateService(@Param('id') id: string, @Body() dto: UpdateHotelServiceDto) {
    return this.servicesService.updateService(id, dto);
  }

  // --- Requests ---

  @Post('requests')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'RECEPTIONIST')
  createRequest(@Body() dto: CreateServiceRequestDto) {
    return this.servicesService.createRequest(dto);
  }

  @Get('requests')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'RECEPTIONIST')
  findAllRequests() {
    return this.servicesService.findAllRequests();
  }

  @Patch('requests/:id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'RECEPTIONIST')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateServiceRequestDto) {
    return this.servicesService.updateRequestStatus(id, dto);
  }
}
