import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsUUID,
  Min,
} from 'class-validator';
import {
  ChargeType,
  PaymentMethod,
  FolioStatus,
  FolioItemSource,
  PaymentStatus,
  Currency,
} from '@prisma/client';

export class CreateFolioDto {
  @IsUUID()
  @IsNotEmpty()
  bookingId: string;

  @IsOptional()
  isPrimary?: boolean;
}

export class AddFolioItemDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(-1000000000)
  unitPrice: number;

  @IsNumber()
  @IsOptional()
  taxRate?: number;

  @IsNumber()
  @IsOptional()
  taxAmount?: number;

  @IsNumber()
  @IsNotEmpty()
  totalAmount: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  quantity?: number;

  @IsEnum(ChargeType)
  @IsNotEmpty()
  type: ChargeType;

  @IsEnum(FolioItemSource)
  @IsOptional()
  source?: FolioItemSource;
}

export class CreatePaymentDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(Currency)
  @IsNotEmpty()
  currency: Currency;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @IsString()
  @IsOptional()
  transactionRef?: string;
}

export class UpdateFolioStatusDto {
  @IsEnum(FolioStatus)
  status: FolioStatus;
}
