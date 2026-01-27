import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsString,
  ValidateNested,
} from 'class-validator';
import { BookingStatus, BookingSource } from '@prisma/client';

export class CreateRoomStayDto {
  @IsUUID()
  @IsOptional()
  roomId?: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsInt()
  @IsOptional()
  adultsCount?: number;

  @IsInt()
  @IsOptional()
  childrenCount?: number;
}

export class CreateBookingDto {
  @IsDateString()
  @IsNotEmpty()
  checkIn: string;

  @IsDateString()
  @IsNotEmpty()
  checkOut: string;

  @IsUUID()
  @IsNotEmpty()
  primaryGuestId: string;

  @IsUUID()
  @IsOptional()
  ratePlanId?: string;

  @IsUUID()
  @IsOptional()
  companyId?: string;

  @IsEnum(BookingSource)
  @IsOptional()
  source?: BookingSource;

  @IsString()
  @IsOptional()
  specialRequests?: string;

  @IsInt()
  @IsOptional()
  adultsCount?: number;

  @IsInt()
  @IsOptional()
  childrenCount?: number;

  @ValidateNested({ each: true })
  @Type(() => CreateRoomStayDto)
  @IsArray()
  @IsOptional()
  roomStays?: CreateRoomStayDto[];
}

export class UpdateBookingDto {
  @IsDateString()
  @IsOptional()
  checkIn?: string;

  @IsDateString()
  @IsOptional()
  checkOut?: string;

  @IsEnum(BookingStatus)
  @IsOptional()
  status?: BookingStatus;

  @IsUUID()
  @IsOptional()
  ratePlanId?: string;

  @IsUUID()
  @IsOptional()
  companyId?: string;
}
