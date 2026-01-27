import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { FinanceService } from './finance.service.js';
import {
  CreateFolioDto,
  AddFolioItemDto,
  CreatePaymentDto,
  UpdateFolioStatusDto,
} from './dto/finance.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { FolioStatus } from '@prisma/client';

@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post('folios')
  @Roles('SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST', 'ADMIN')
  createFolio(@Body() createFolioDto: CreateFolioDto) {
    return this.financeService.createFolio(createFolioDto);
  }

  @Get('folios')
  @Roles('SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST', 'ACCOUNTANT', 'ADMIN')
  findAllFolios(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.financeService.findAllFolios({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      search,
      status: status as FolioStatus,
    });
  }

  @Get('folios/:id')
  findOneFolio(@Param('id') id: string) {
    return this.financeService.findOneFolio(id);
  }

  @Get('folios/:id/balance')
  getFolioBalance(@Param('id') id: string) {
    return this.financeService.getFolioBalance(id);
  }

  @Get('stats/folios')
  @Roles('SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST', 'ACCOUNTANT', 'ADMIN')
  getFolioStats() {
    return this.financeService.getFolioStats();
  }

  @Post('folios/:id/items')
  @Roles('SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST', 'ACCOUNTANT', 'ADMIN')
  addItem(
    @Param('id') id: string,
    @Body() addItemDto: AddFolioItemDto,
    @Request() req: any,
  ) {
    return this.financeService.addItem(id, addItemDto, req.user.id);
  }

  @Post('folios/:id/items/:itemId/adjust')
  @Roles('SUPER_ADMIN', 'MANAGER', 'ACCOUNTANT', 'ADMIN')
  adjustCharge(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Request() req: any,
  ) {
    return this.financeService.adjustCharge(id, itemId, req.user.id);
  }

  @Post('folios/:id/payments')
  @Roles('SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST', 'ACCOUNTANT', 'ADMIN')
  recordPayment(
    @Param('id') id: string,
    @Body() createPaymentDto: CreatePaymentDto,
    @Request() req: any,
  ) {
    return this.financeService.recordPayment(id, createPaymentDto, req.user.id);
  }

  @Patch('folios/:id/status')
  @Roles('SUPER_ADMIN', 'MANAGER', 'ACCOUNTANT', 'ADMIN')
  updateFolioStatus(
    @Param('id') id: string,
    @Body() updateFolioStatusDto: UpdateFolioStatusDto,
  ) {
    return this.financeService.updateFolioStatus(id, updateFolioStatusDto);
  }

  @Get('bookings/:bookingId/folios')
  findAllByBooking(@Param('bookingId') bookingId: string) {
    return this.financeService.findAllByBooking(bookingId);
  }

  @Get('folios/:id/room-charges-summary')
  getRoomChargesSummary(@Param('id') id: string) {
    return this.financeService.getRoomChargesSummary(id);
  }
}
