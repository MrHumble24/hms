import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsNumber,
  IsString,
  IsUUID,
  IsArray,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RecipeItemDto {
  @IsNotEmpty()
  @IsUUID()
  inventoryItemId: string;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;
}

export class CreateMenuItemDto {
  @IsNotEmpty()
  @IsObject()
  name: Record<string, string>;

  @IsOptional()
  @IsObject()
  description?: Record<string, string>;

  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsNumber()
  calories?: number;

  @IsOptional()
  @IsString()
  ingredients?: string;

  @IsNotEmpty()
  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeItemDto)
  recipe?: RecipeItemDto[];

  @IsOptional()
  @IsBoolean()
  isSimpleItem?: boolean;

  @IsOptional()
  @IsUUID()
  linkedInventoryId?: string;
}

export class UpdateMenuItemDto {
  @IsOptional()
  @IsObject()
  name?: Record<string, string>;

  @IsOptional()
  @IsObject()
  description?: Record<string, string>;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsNumber()
  calories?: number;

  @IsOptional()
  @IsString()
  ingredients?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeItemDto)
  recipe?: RecipeItemDto[];

  @IsOptional()
  @IsBoolean()
  isSimpleItem?: boolean;

  @IsOptional()
  @IsUUID()
  linkedInventoryId?: string;
}
