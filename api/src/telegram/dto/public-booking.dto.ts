import {
  IsString,
  IsDateString,
  IsInt,
  Min,
  IsOptional,
} from 'class-validator';

export class CheckAvailabilityDto {
  @IsString()
  branchId: string;

  @IsDateString()
  checkIn: string;

  @IsDateString()
  checkOut: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  guests?: number = 1;
}

export class CreatePublicBookingDto {
  @IsString()
  branchId: string;

  @IsString()
  roomTypeId: string;

  @IsDateString()
  checkIn: string;

  @IsDateString()
  checkOut: string;

  // Guest info
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  phone: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  citizenship: string;

  @IsString()
  passportSeries: string;

  @IsString()
  passportNumber: string;

  @IsDateString()
  dateOfBirth: string;

  @IsString()
  gender: 'MALE' | 'FEMALE';

  @IsInt()
  @Min(1)
  @IsOptional()
  adultsCount?: number = 1;

  @IsInt()
  @Min(0)
  @IsOptional()
  childrenCount?: number = 0;

  // Telegram user info for tracking
  @IsString()
  @IsOptional()
  telegramUserId?: string;
}
