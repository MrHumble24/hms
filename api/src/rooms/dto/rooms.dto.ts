import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsInt,
  Min,
  IsBoolean,
  IsDateString,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RoomStatus, CancellationPolicy } from '@prisma/client';

export class CreateRoomTypeDto {
  @IsString()
  name: string;

  @IsNumber()
  basePrice: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  amenities?: string[];

  @IsArray()
  @IsOptional()
  images?: string[];
}

export class UpdateRoomTypeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  basePrice?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  amenities?: string[];

  @IsArray()
  @IsOptional()
  images?: string[];
}

export class CreateRoomDto {
  @IsString()
  number: string;

  @IsInt()
  @Min(0)
  floor: number;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsString()
  typeId: string;

  @IsArray()
  @IsOptional()
  images?: string[];

  @IsBoolean()
  @IsOptional()
  isGalleryInherited?: boolean;
}

export class UpdateRoomDto {
  @IsString()
  @IsOptional()
  number?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  floor?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @IsString()
  @IsOptional()
  typeId?: string;

  @IsEnum(RoomStatus)
  @IsOptional()
  status?: RoomStatus;

  @IsBoolean()
  @IsOptional()
  isOccupied?: boolean;

  @IsBoolean()
  @IsOptional()
  isDueOut?: boolean;

  @IsBoolean()
  @IsOptional()
  isDueIn?: boolean;

  @IsDateString()
  @IsOptional()
  lastCleanedAt?: string | Date;

  @IsDateString()
  @IsOptional()
  lastInspectedAt?: string | Date;

  @IsArray()
  @IsOptional()
  images?: string[];

  @IsBoolean()
  @IsOptional()
  isGalleryInherited?: boolean;
}

export class CreatePriceModifierDto {
  @IsString()
  name: string;

  @IsString()
  roomTypeId: string;

  @IsNumber()
  @IsOptional()
  percentage?: number;

  @IsNumber()
  @IsOptional()
  fixedValue?: number;

  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @IsOptional()
  isActive?: boolean;
}

export class UpdatePriceModifierDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  percentage?: number;

  @IsNumber()
  @IsOptional()
  fixedValue?: number;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsOptional()
  isActive?: boolean;
}

export class CreateRatePlanDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  includesBreakfast?: boolean;

  @IsBoolean()
  @IsOptional()
  includesParking?: boolean;

  @IsBoolean()
  @IsOptional()
  includesWifi?: boolean;

  @IsEnum(CancellationPolicy)
  @IsOptional()
  cancellationPolicy?: CancellationPolicy;

  @IsInt()
  @IsOptional()
  cancellationHours?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateRatePlanRoomTypeDto {
  @IsUUID()
  ratePlanId: string;

  @IsUUID()
  roomTypeId: string;

  @IsNumber()
  price: number;
}

export class BulkQrDownloadDto {
  @IsArray()
  @IsOptional()
  @IsUUID(undefined, { each: true })
  roomIds?: string[];

  @IsString()
  baseUrl: string;
}
