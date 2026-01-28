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
} from './dto/hotel-services.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('hotel-services')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HotelServicesController {
  constructor(private readonly servicesService: HotelServicesService) {}

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
