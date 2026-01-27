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
import { RestaurantService } from './restaurant.service.js';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/categories.dto.js';
import { CreateMenuItemDto, UpdateMenuItemDto } from './dto/menu-items.dto.js';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  GuestOrderDto,
} from './dto/orders.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Public } from '../auth/decorators/public.decorator.js';

@Controller('restaurant')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  // --- Categories ---
  @Post('categories')
  @Roles('SUPER_ADMIN', 'MANAGER', 'ADMIN')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.restaurantService.createCategory(dto);
  }

  @Get('categories')
  findAllCategories() {
    return this.restaurantService.findAllCategories();
  }

  @Patch('categories/:id')
  @Roles('SUPER_ADMIN', 'MANAGER', 'ADMIN')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.restaurantService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @Roles('SUPER_ADMIN', 'MANAGER', 'ADMIN')
  removeCategory(@Param('id') id: string) {
    return this.restaurantService.removeCategory(id);
  }

  // --- Menu Items ---
  @Post('menu-items')
  @Roles('SUPER_ADMIN', 'MANAGER', 'ADMIN')
  createMenuItem(@Body() dto: CreateMenuItemDto) {
    return this.restaurantService.createMenuItem(dto);
  }

  @Get('menu-items')
  findAllMenuItems(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('isSimpleItem') isSimpleItem?: string,
  ) {
    return this.restaurantService.findAllMenuItems({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      search,
      categoryId,
      isSimpleItem:
        isSimpleItem === 'true'
          ? true
          : isSimpleItem === 'false'
            ? false
            : undefined,
    });
  }

  @Get('menu-items/:id')
  findOneMenuItem(@Param('id') id: string) {
    return this.restaurantService.findOneMenuItem(id);
  }

  @Patch('menu-items/:id')
  @Roles('SUPER_ADMIN', 'MANAGER', 'ADMIN')
  updateMenuItem(@Param('id') id: string, @Body() dto: UpdateMenuItemDto) {
    return this.restaurantService.updateMenuItem(id, dto);
  }

  @Delete('menu-items/:id')
  @Roles('SUPER_ADMIN', 'MANAGER', 'ADMIN')
  removeMenuItem(@Param('id') id: string) {
    return this.restaurantService.removeMenuItem(id);
  }

  @Post('orders')
  @Roles('SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST', 'WAITER', 'ADMIN')
  createOrder(@Body() dto: CreateOrderDto, @Request() req: any) {
    return this.restaurantService.createOrder(dto, req.user.id);
  }

  // --- Public Guest Endpoints ---

  @Get('public/categories')
  @Public()
  findPublicCategories() {
    return this.restaurantService.findAllCategories();
  }

  @Get('public/menu-items')
  @Public()
  findPublicMenuItems(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.restaurantService.findAllMenuItems({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      search,
      categoryId,
    });
  }

  @Post('public/orders')
  @Public()
  createGuestOrder(@Body() dto: GuestOrderDto) {
    return this.restaurantService.createGuestOrder(dto);
  }

  @Get('public/orders/room/:roomId')
  @Public()
  getRoomOrders(@Param('roomId') roomId: string) {
    return this.restaurantService.getRoomOrders(roomId);
  }

  @Get('orders')
  @Roles('SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST', 'ADMIN')
  findAllOrders(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.restaurantService.findAllOrders({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      search,
      status,
    });
  }

  @Patch('orders/:id/status')
  @Roles('SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST', 'ADMIN')
  updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.restaurantService.updateOrderStatus(id, dto);
  }
}
