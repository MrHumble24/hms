import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { EmehmonService } from './emehmon.service.js';
import { RegisterGuestDto } from './dto/emehmon.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('emehmon')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmehmonController {
  constructor(private readonly emehmonService: EmehmonService) {}

  @Post('register')
  @Roles('SUPER_ADMIN', 'RECEPTIONIST', 'MANAGER')
  register(@Body() dto: RegisterGuestDto) {
    return this.emehmonService.registerGuest(dto.bookingId);
  }

  @Get('logs/:bookingId')
  @Roles('SUPER_ADMIN', 'RECEPTIONIST', 'MANAGER')
  getLogs(@Param('bookingId') bookingId: string) {
    return this.emehmonService.getLogsByBooking(bookingId);
  }
}
