import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
} from 'class-validator';
import {
  InventoryCategory,
  StockUpdateReason,
} from '@prisma/client';

export class CreateInventoryItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  minThreshold?: number;

  @IsEnum(InventoryCategory)
  category: InventoryCategory;
}

export class UpdateInventoryItemDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  quantity?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  minThreshold?: number;

  @IsEnum(InventoryCategory)
  @IsOptional()
  category?: InventoryCategory;
}

export class UpdateStockDto {
  @IsNumber()
  change: number;

  @IsEnum(StockUpdateReason)
  reason: StockUpdateReason;

  @IsString()
  @IsOptional()
  note?: string;
}
