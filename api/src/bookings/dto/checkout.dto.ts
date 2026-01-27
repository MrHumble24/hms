import {
  IsOptional,
  IsNumber,
  IsEnum,
  IsString,
  IsBoolean,
  Min,
  IsArray,
} from 'class-validator';
import { PaymentMethod, RoomStatus } from '@prisma/client';

export class CheckoutDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  paymentAmount?: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  transactionRef?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  // Room condition after checkout
  @IsOptional()
  @IsEnum(RoomStatus)
  roomStatus?: RoomStatus;

  // Additional charges to post (damages, etc.)
  @IsOptional()
  @IsArray()
  additionalCharges?: AdditionalChargeDto[];

  // Request feedback survey
  @IsOptional()
  @IsBoolean()
  requestFeedback?: boolean;

  // Maintenance issues reported
  @IsOptional()
  @IsString()
  maintenanceNotes?: string;
}

export class AdditionalChargeDto {
  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsNumber()
  @Min(1)
  quantity?: number;
}
