import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Request as NestRequest,
  Query,
} from '@nestjs/common';
import { InventoryService } from './inventory.service.js';
import {
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
  UpdateStockDto,
} from './dto/inventory.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

import { BranchAccessGuard } from '../auth/guards/branch-access.guard.js';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard, BranchAccessGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  create(@Body() createInventoryItemDto: CreateInventoryItemDto) {
    return this.inventoryService.create(createInventoryItemDto);
  }

  @Get()
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    return this.inventoryService.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      search,
      category,
    });
  }

  @Get('low-stock')
  getLowStockItems() {
    return this.inventoryService.getLowStockItems();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  update(
    @Param('id') id: string,
    @Body() updateInventoryItemDto: UpdateInventoryItemDto,
  ) {
    return this.inventoryService.update(id, updateInventoryItemDto);
  }

  @Patch(':id/stock')
  @Roles('SUPER_ADMIN', 'MANAGER', 'ACCOUNTANT', 'HOUSEKEEPER', 'MAINTENANCE')
  updateStock(
    @Param('id') id: string,
    @Body() updateStockDto: UpdateStockDto,
    @NestRequest() req: any,
  ) {
    return this.inventoryService.updateStock(id, updateStockDto, req.user.id);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  remove(@Param('id') id: string) {
    return this.inventoryService.remove(id);
  }
}
