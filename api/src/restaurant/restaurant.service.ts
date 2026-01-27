import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/categories.dto.js';
import { CreateMenuItemDto, UpdateMenuItemDto } from './dto/menu-items.dto.js';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  GuestOrderDto,
} from './dto/orders.dto.js';
import { AiService } from './ai.service.js';
import {
  ChargeType,
  FolioItemSource,
  Prisma,
  RestaurantOrderStatus,
  StockUpdateReason,
} from '@prisma/client';
import { getTenantContext } from '../common/tenant-context.js';

@Injectable()
export class RestaurantService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  private getContext() {
    const context = getTenantContext();
    if (!context?.branchId || !context?.tenantId) {
      throw new BadRequestException('Tenant and Branch context are required');
    }
    return context;
  }

  // --- Categories ---
  async createCategory(dto: CreateCategoryDto) {
    const { branchId, tenantId } = this.getContext();
    return this.prisma.restaurantCategory.create({
      data: {
        name: dto.name as Prisma.JsonObject,
        branchId,
        tenantId,
      },
    });
  }

  async findAllCategories() {
    const { branchId, tenantId } = this.getContext();
    return this.prisma.restaurantCategory.findMany({
      where: { branchId, tenantId },
      include: { items: true },
    });
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const { branchId, tenantId } = this.getContext();
    return this.prisma.restaurantCategory.update({
      where: { id },
      data: {
        name: dto.name as Prisma.JsonObject,
      },
    });
  }

  async removeCategory(id: string) {
    const { branchId, tenantId } = this.getContext();
    return this.prisma.restaurantCategory.delete({
      where: { id },
    });
  }

  // --- Menu Items ---
  async createMenuItem(dto: CreateMenuItemDto) {
    const { branchId, tenantId } = this.getContext();
    let calories = dto.calories;
    if (!calories && dto.ingredients && dto.name) {
      const nameObj = dto.name as any;
      const nameStr = nameObj['en'] || Object.values(nameObj)[0];
      calories =
        (await this.aiService.estimateCalories(nameStr, dto.ingredients)) ||
        undefined;
    }

    return this.prisma.restaurantMenuItem.create({
      data: {
        name: dto.name as Prisma.JsonObject,
        description: dto.description as Prisma.JsonObject,
        price: dto.price,
        imageUrl: dto.imageUrl,
        calories: calories,
        ingredients: dto.ingredients,
        categoryId: dto.categoryId,
        branchId,
        tenantId,
        isSimpleItem: dto.isSimpleItem || false,
        linkedInventoryId: dto.linkedInventoryId,
        recipe: dto.recipe
          ? {
              create: dto.recipe.map((r) => ({
                inventoryItemId: r.inventoryItemId,
                quantity: r.quantity,
              })),
            }
          : undefined,
      },
      include: { category: true, recipe: true },
    });
  }

  async findAllMenuItems(params?: {
    skip?: number;
    take?: number;
    search?: string;
    categoryId?: string;
    isSimpleItem?: boolean;
  }) {
    const { branchId, tenantId } = this.getContext();
    const where: any = { branchId, tenantId };

    if (params?.categoryId && params.categoryId !== 'ALL') {
      where.categoryId = params.categoryId;
    }

    if (params?.isSimpleItem !== undefined) {
      where.isSimpleItem = params.isSimpleItem;
    }

    if (params?.search) {
      where.OR = [
        { name: { path: ['en'], string_contains: params.search } }, // Assuming JSON structure
        { description: { path: ['en'], string_contains: params.search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.restaurantMenuItem.findMany({
        where,
        skip: params?.skip || 0,
        take: params?.take || 10,
        include: { category: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.restaurantMenuItem.count({ where }),
    ]);

    return { data, total };
  }

  async findOneMenuItem(id: string) {
    const { branchId, tenantId } = this.getContext();
    const item = await this.prisma.restaurantMenuItem.findFirst({
      where: { id, branchId, tenantId },
      include: { category: true },
    });
    if (!item) throw new NotFoundException('Menu item not found');
    return item;
  }

  async updateMenuItem(id: string, dto: UpdateMenuItemDto) {
    const { branchId, tenantId } = this.getContext();
    return this.prisma.restaurantMenuItem.update({
      where: { id },
      data: {
        name: dto.name as Prisma.JsonObject,
        description: dto.description as Prisma.JsonObject,
        price: dto.price,
        imageUrl: dto.imageUrl,
        calories: dto.calories,
        ingredients: dto.ingredients,
        categoryId: dto.categoryId,
        isSimpleItem: dto.isSimpleItem,
        linkedInventoryId: dto.linkedInventoryId,
        recipe: dto.recipe
          ? {
              deleteMany: {},
              create: dto.recipe.map((r) => ({
                inventoryItemId: r.inventoryItemId,
                quantity: r.quantity,
              })),
            }
          : undefined,
        tenantId,
      },
      include: { category: true, recipe: true },
    });
  }

  async removeMenuItem(id: string) {
    const { tenantId } = this.getContext();
    return this.prisma.restaurantMenuItem.delete({
      where: { id, tenantId },
    });
  }

  // --- Orders ---
  async createOrder(dto: CreateOrderDto, staffId: string) {
    const { branchId, tenantId } = this.getContext();
    return this.createOrderInternal(dto, branchId, tenantId, staffId);
  }

  async createGuestOrder(dto: GuestOrderDto) {
    const { branchId, tenantId } = this.getContext();

    // Find active booking for the room
    const booking = await this.prisma.booking.findFirst({
      where: {
        tenantId,
        branchId,
        status: 'CHECKED_IN',
        roomStays: {
          some: {
            roomId: dto.roomId,
            status: 'CHECKED_IN',
          },
        },
      },
      include: { folios: true },
    });

    if (!booking) {
      throw new BadRequestException(
        'No active checked-in booking found for this room.',
      );
    }

    return this.createOrderInternal(
      {
        ...dto,
        bookingId: booking.id,
      },
      branchId,
      tenantId,
      null,
    );
  }

  async getRoomOrders(roomId: string) {
    const { branchId, tenantId } = this.getContext();

    // 1. Find the active booking for this room
    const booking = await this.prisma.booking.findFirst({
      where: {
        tenantId,
        branchId,
        status: 'CHECKED_IN',
        roomStays: {
          some: {
            roomId,
            status: 'CHECKED_IN',
          },
        },
      },
    });

    if (!booking) return [];

    // 2. Return all orders for this booking
    return this.prisma.restaurantOrder.findMany({
      where: {
        bookingId: booking.id,
        branchId,
        tenantId,
      },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        items: {
          include: {
            menuItem: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async createOrderInternal(
    dto: CreateOrderDto,
    branchId: string,
    tenantId: string,
    staffId: string | null,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Calculate total and verify items
      let totalAmount = 0;
      const orderItemsData: Prisma.RestaurantOrderItemCreateWithoutOrderInput[] =
        [];

      for (const item of dto.items) {
        const menuItem = await tx.restaurantMenuItem.findFirst({
          where: { id: item.menuItemId, branchId, tenantId },
        });
        if (!menuItem)
          throw new NotFoundException(`Menu item ${item.menuItemId} not found`);

        totalAmount += Number(menuItem.price) * item.quantity;

        orderItemsData.push({
          menuItem: { connect: { id: item.menuItemId } },
          quantity: item.quantity,
          price: menuItem.price,
          notes: item.notes,
        });
      }

      // 2. Create the order
      const order = await tx.restaurantOrder.create({
        data: {
          tableNumber: dto.tableNumber,
          bookingId: dto.bookingId,
          branchId,
          tenantId,
          totalAmount,
          items: {
            create: orderItemsData,
          },
        },
        include: { items: { include: { menuItem: true } } },
      });

      // 3. If bookingId is provided, post to Folio
      if (dto.bookingId) {
        const booking = await tx.booking.findFirst({
          where: { id: dto.bookingId, branchId, tenantId },
          include: { folios: true },
        });

        if (!booking) throw new NotFoundException('Booking not found');

        const primaryFolio = booking.folios.find((f) => f.isPrimary);
        if (!primaryFolio)
          throw new BadRequestException(
            'No primary folio found for this booking',
          );

        await tx.folioItem.create({
          data: {
            folioId: primaryFolio.id,
            tenantId,
            description: `Restaurant Order #${order.id.slice(-6)} ${dto.tableNumber ? `(Table ${dto.tableNumber})` : ''}`,
            unitPrice: totalAmount,
            taxRate: 0,
            taxAmount: 0,
            totalAmount: totalAmount,
            quantity: 1,
            type: ChargeType.RESTAURANT,
            source: FolioItemSource.SYSTEM,
            staffId,
          },
        });
      }

      return order;
    });
  }

  async findAllOrders(params?: {
    skip?: number;
    take?: number;
    search?: string;
    status?: string;
  }) {
    const { branchId, tenantId } = this.getContext();
    const where: any = { branchId, tenantId };

    if (params?.status && params.status !== 'ALL') {
      where.status = params.status;
    }

    if (params?.search) {
      where.OR = [
        { tableNumber: { contains: params.search, mode: 'insensitive' } },
        {
          booking: {
            primaryGuest: {
              firstName: { contains: params.search, mode: 'insensitive' },
            },
          },
        },
        {
          booking: {
            primaryGuest: {
              lastName: { contains: params.search, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.restaurantOrder.findMany({
        where,
        skip: params?.skip || 0,
        take: params?.take || 10,
        include: {
          items: { include: { menuItem: true } },
          booking: { include: { primaryGuest: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.restaurantOrder.count({ where }),
    ]);

    return { data, total };
  }

  async updateOrderStatus(
    id: string,
    dto: UpdateOrderStatusDto,
    staffId?: string,
  ) {
    const { branchId, tenantId } = this.getContext();
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.restaurantOrder.update({
        where: { id, tenantId },
        data: { status: dto.status },
        include: {
          items: {
            include: {
              menuItem: {
                include: {
                  recipe: true,
                  linkedInventory: true,
                },
              },
            },
          },
        },
      });

      // Deduction logic: when order moves to PREPARING
      if (dto.status === RestaurantOrderStatus.PREPARING) {
        for (const item of order.items) {
          // Simple item deduction
          if (item.menuItem.isSimpleItem && item.menuItem.linkedInventoryId) {
            await this.deductStock(
              tx,
              item.menuItem.linkedInventoryId,
              item.quantity,
              order.id,
              tenantId,
              staffId,
            );
          }

          // Complex item deduction (recipe)
          for (const ingredient of item.menuItem.recipe) {
            const deductionAmount = ingredient.quantity * item.quantity;
            await this.deductStock(
              tx,
              ingredient.inventoryItemId,
              deductionAmount,
              order.id,
              tenantId,
              staffId,
            );
          }
        }
      }

      return order;
    });
  }

  private async deductStock(
    tx: Prisma.TransactionClient,
    itemId: string,
    amount: number,
    orderId: string,
    tenantId: string,
    staffId?: string,
  ) {
    await tx.inventoryItem.update({
      where: { id: itemId, tenantId },
      data: {
        quantity: { decrement: amount },
      },
    });

    await tx.stockLog.create({
      data: {
        itemId: itemId,
        tenantId,
        staffId: staffId || 'system',
        change: -amount,
        reason: StockUpdateReason.RESTAURANT_ORDER,
        note: `Order #${orderId.slice(-6)}`,
      },
    });
  }
}
