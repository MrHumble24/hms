import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
  UpdateStockDto,
} from './dto/inventory.dto.js';
import { getTenantContext } from '../common/tenant-context.js';
import { StockUpdateReason } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  private getContext() {
    const context = getTenantContext();
    if (!context?.branchId || !context?.tenantId) {
      throw new BadRequestException('Tenant and Branch context are required');
    }
    return context;
  }

  async create(createInventoryItemDto: CreateInventoryItemDto) {
    const { branchId, tenantId } = this.getContext();

    const existing = await this.prisma.inventoryItem.findFirst({
      where: {
        sku: createInventoryItemDto.sku,
        branchId,
        tenantId,
      },
    });
    if (existing)
      throw new ConflictException(
        'Item with this SKU already exists in this branch',
      );

    return this.prisma.inventoryItem.create({
      data: {
        ...createInventoryItemDto,
        branchId,
        tenantId,
      },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    search?: string;
    category?: string;
  }) {
    const { branchId, tenantId } = this.getContext();
    const where: any = { branchId, tenantId };

    if (params.category && params.category !== 'ALL') {
      where.category = params.category;
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { sku: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.inventoryItem.findMany({
        where,
        skip: params.skip || 0,
        take: params.take || 10,
        orderBy: { name: 'asc' },
        include: {
          lastUpdatedBy: {
            select: { fullName: true, role: true },
          },
        },
      }),
      this.prisma.inventoryItem.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(id: string) {
    const { branchId, tenantId } = this.getContext();
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, branchId, tenantId },
      include: {
        lastUpdatedBy: {
          select: { fullName: true, role: true },
        },
        stockLogs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { staff: { select: { fullName: true } } },
        },
      },
    });
    if (!item) throw new NotFoundException('Inventory item not found');
    return item;
  }

  async update(id: string, updateInventoryItemDto: UpdateInventoryItemDto) {
    const { branchId, tenantId } = this.getContext();
    await this.findOne(id);

    if (updateInventoryItemDto.sku) {
      const existing = await this.prisma.inventoryItem.findFirst({
        where: {
          sku: updateInventoryItemDto.sku,
          branchId,
          tenantId,
        },
      });
      if (existing && existing.id !== id)
        throw new ConflictException(
          'Item with this SKU already exists in this branch',
        );
    }

    return this.prisma.inventoryItem.update({
      where: { id, tenantId },
      data: updateInventoryItemDto,
    });
  }

  async updateStock(
    id: string,
    updateStockDto: UpdateStockDto,
    staffId: string,
  ) {
    const { branchId, tenantId } = this.getContext();
    const item = await this.findOne(id);
    const newQuantity = item.quantity + updateStockDto.change;

    if (newQuantity < 0) throw new ConflictException('Insufficient stock');

    return this.prisma.$transaction(async (tx) => {
      // Create Log
      await tx.stockLog.create({
        data: {
          itemId: id,
          tenantId,
          staffId,
          change: updateStockDto.change,
          reason: updateStockDto.reason as StockUpdateReason,
          note: updateStockDto.note,
        },
      });

      // Update Item
      return tx.inventoryItem.update({
        where: { id, tenantId },
        data: {
          quantity: newQuantity,
          lastRestocked:
            updateStockDto.change > 0 ? new Date() : item.lastRestocked,
          lastUpdatedById: staffId,
        },
      });
    });
  }

  async remove(id: string) {
    const { branchId, tenantId } = this.getContext();
    await this.findOne(id);
    return this.prisma.inventoryItem.delete({
      where: { id, tenantId },
    });
  }

  async getLowStockItems() {
    const { branchId, tenantId } = this.getContext();
    // Use $queryRaw to compare quantity with minThreshold column
    return this.prisma.$queryRaw`
      SELECT * FROM "InventoryItem"
      WHERE "branchId" = ${branchId}
        AND "tenantId" = ${tenantId}
        AND "quantity" <= "minThreshold"
      ORDER BY "name" ASC
    `;
  }
}
