import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Res,
  StreamableFile,
  Query,
} from '@nestjs/common';
import type { Response } from 'express';
import { RoomsService } from './rooms.service.js';
import {
  CreateRoomTypeDto,
  UpdateRoomTypeDto,
  CreateRoomDto,
  UpdateRoomDto,
  CreatePriceModifierDto,
  UpdatePriceModifierDto,
  BulkQrDownloadDto,
} from './dto/rooms.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

import { BranchAccessGuard } from '../auth/guards/branch-access.guard.js';

@Controller('rooms')
@UseGuards(JwtAuthGuard, RolesGuard, BranchAccessGuard)
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  // --- Room Type Endpoints ---

  @Post('types')
  @Roles('SUPER_ADMIN', 'MANAGER', 'ADMIN')
  createRoomType(@Body() createRoomTypeDto: CreateRoomTypeDto) {
    return this.roomsService.createRoomType(createRoomTypeDto);
  }

  @Get('types')
  @Roles('SUPER_ADMIN', 'MANAGER', 'ADMIN')
  findAllRoomTypes() {
    return this.roomsService.findAllRoomTypes();
  }

  @Get('types/:id')
  @Roles('SUPER_ADMIN', 'MANAGER', 'ADMIN')
  findOneRoomType(@Param('id') id: string) {
    return this.roomsService.findOneRoomType(id);
  }

  @Patch('types/:id')
  @Roles('SUPER_ADMIN', 'MANAGER', 'ADMIN')
  updateRoomType(
    @Param('id') id: string,
    @Body() updateRoomTypeDto: UpdateRoomTypeDto,
  ) {
    return this.roomsService.updateRoomType(id, updateRoomTypeDto);
  }

  @Delete('types/:id')
  @Roles('SUPER_ADMIN', 'MANAGER', 'ADMIN')
  removeRoomType(@Param('id') id: string) {
    return this.roomsService.removeRoomType(id);
  }

  // --- Room Endpoints ---

  @Post()
  @Roles('SUPER_ADMIN', 'MANAGER', 'ADMIN')
  createRoom(@Body() createRoomDto: CreateRoomDto) {
    return this.roomsService.createRoom(createRoomDto);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'MANAGER', 'ADMIN')
  findAllRooms(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('typeId') typeId?: string,
    @Query('status') status?: string,
  ) {
    return this.roomsService.findAllRooms({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      search,
      typeId,
      status,
    });
  }

  @Get('dashboard')
  @Roles('SUPER_ADMIN', 'MANAGER', 'ADMIN')
  getDashboard() {
    return this.roomsService.getDashboard();
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'MANAGER', 'ADMIN')
  findOneRoom(@Param('id') id: string) {
    return this.roomsService.findOneRoom(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST', 'ADMIN') // Receptionist might update status
  updateRoom(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
    return this.roomsService.updateRoom(id, updateRoomDto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'MANAGER', 'ADMIN')
  removeRoom(@Param('id') id: string) {
    return this.roomsService.removeRoom(id);
  }

  @Post('qr-codes/bulk')
  @Roles('SUPER_ADMIN', 'MANAGER', 'ADMIN')
  async bulkDownloadQrCodes(
    @Body() dto: BulkQrDownloadDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const stream = await this.roomsService.bulkDownloadQrCodes(dto);
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename=room-qrs.zip',
    });
    return new StreamableFile(stream);
  }

  // --- Price Modifier Endpoints ---

  @Post('price-modifiers')
  @Roles('SUPER_ADMIN', 'MANAGER', 'ADMIN')
  createPriceModifier(@Body() dto: CreatePriceModifierDto) {
    return this.roomsService.createPriceModifier(dto);
  }

  @Get('price-modifiers')
  @Roles('SUPER_ADMIN', 'MANAGER', 'ADMIN')
  findAllPriceModifiers() {
    return this.roomsService.findAllPriceModifiers();
  }

  @Get('price-modifiers/:id')
  @Roles('SUPER_ADMIN', 'MANAGER', 'ADMIN')
  findOnePriceModifier(@Param('id') id: string) {
    return this.roomsService.findOnePriceModifier(id);
  }

  @Patch('price-modifiers/:id')
  @Roles('SUPER_ADMIN', 'MANAGER', 'ADMIN')
  updatePriceModifier(
    @Param('id') id: string,
    @Body() dto: UpdatePriceModifierDto,
  ) {
    return this.roomsService.updatePriceModifier(id, dto);
  }

  @Delete('price-modifiers/:id')
  @Roles('SUPER_ADMIN', 'MANAGER', 'ADMIN')
  removePriceModifier(@Param('id') id: string) {
    return this.roomsService.removePriceModifier(id);
  }

  @Get('types/:id/effective-price')
  getEffectivePrice(@Param('id') id: string, @Body('date') date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    return this.roomsService.getEffectivePrice(id, targetDate);
  }
}
