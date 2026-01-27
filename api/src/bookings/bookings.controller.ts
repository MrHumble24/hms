import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { BookingsService } from './bookings.service.js';
import { CreateBookingDto, UpdateBookingDto } from './dto/bookings.dto.js';
import { CheckoutDto } from './dto/checkout.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

import { BranchAccessGuard } from '../auth/guards/branch-access.guard.js';

@Controller('bookings')
@UseGuards(JwtAuthGuard, RolesGuard, BranchAccessGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST', 'ADMIN')
  create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(createBookingDto);
  }

  @Get()
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.bookingsService.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      search,
      status,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST', 'ADMIN')
  update(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @Request() req: any,
  ) {
    return this.bookingsService.update(id, updateBookingDto, req.user.id);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'MANAGER', 'ADMIN')
  remove(@Param('id') id: string) {
    return this.bookingsService.remove(id);
  }

  @Post(':id/checkout')
  @Roles('SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST', 'ADMIN')
  checkout(
    @Param('id') id: string,
    @Body() checkoutDto: CheckoutDto,
    @Request() req: any,
  ) {
    return this.bookingsService.checkout(id, checkoutDto, req.user.id);
  }
}
