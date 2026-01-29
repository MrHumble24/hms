import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsUUID,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import {
  ServiceCategory,
  ServiceRequestStatus,
  Currency,
} from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateHotelServiceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ServiceCategory)
  category: ServiceCategory;

  @IsNumber()
  @Type(() => Number)
  basePrice: number;

  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateHotelServiceDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ServiceCategory)
  @IsOptional()
  category?: ServiceCategory;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  basePrice?: number;

  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateServiceRequestDto {
  @IsUUID()
  serviceId: string;

  @IsUUID()
  @IsOptional()
  bookingId?: string;

  @IsString()
  @IsOptional()
  roomId?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  quantity?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsDateString()
  @IsOptional()
  scheduledFor?: string;
}

export class UpdateServiceRequestDto {
  @IsEnum(ServiceRequestStatus)
  @IsOptional()
  status?: ServiceRequestStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}
