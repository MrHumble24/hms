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
  basePrice: number;

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
  bookingId: string;

  @IsNumber()
  @IsOptional()
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
