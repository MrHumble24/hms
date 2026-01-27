import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommunicationsService } from './communications.service.js';
import {
  CreateCommunicationDto,
  UpdateCommunicationStatusDto,
  QueryCommunicationsDto,
} from './dto/communications.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '@prisma/client';

@Controller('communications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommunicationsController {
  constructor(private readonly communicationsService: CommunicationsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.RECEPTIONIST)
  create(@Body() dto: CreateCommunicationDto) {
    return this.communicationsService.create(dto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.RECEPTIONIST)
  findAll(@Query() query: QueryCommunicationsDto) {
    return this.communicationsService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.RECEPTIONIST)
  findOne(@Param('id') id: string) {
    return this.communicationsService.findOne(id);
  }

  @Get('guest/:guestId')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.RECEPTIONIST)
  findByGuest(@Param('guestId') guestId: string) {
    return this.communicationsService.findByGuest(guestId);
  }

  @Get('booking/:bookingId')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.RECEPTIONIST)
  findByBooking(@Param('bookingId') bookingId: string) {
    return this.communicationsService.findByBooking(bookingId);
  }

  @Patch(':id/status')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCommunicationStatusDto,
  ) {
    return this.communicationsService.updateStatus(id, dto);
  }

  @Post('booking/:bookingId/confirmation')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.RECEPTIONIST)
  sendBookingConfirmation(@Param('bookingId') bookingId: string) {
    return this.communicationsService.sendBookingConfirmation(bookingId);
  }
}
