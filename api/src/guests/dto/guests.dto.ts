import {
  IsString,
  IsOptional,
  IsEmail,
  IsDateString,
  IsEnum,
  IsUrl,
  IsInt,
  Min,
  IsBoolean,
} from 'class-validator';
import { Gender, VisaType } from '@prisma/client';

export class CreateGuestDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  @IsOptional()
  patronymic?: string;

  @IsString()
  phone: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  citizenship: string;

  @IsString()
  passportSeries: string;

  @IsString()
  passportNumber: string;

  @IsDateString()
  dateOfBirth: string | Date;

  @IsEnum(Gender)
  gender: Gender;

  @IsString()
  @IsOptional()
  visaNumber?: string;

  @IsDateString()
  @IsOptional()
  dateOfEntry?: string | Date;

  @IsDateString()
  @IsOptional()
  passportIssueDate?: string | Date;

  @IsDateString()
  @IsOptional()
  passportExpiryDate?: string | Date;

  @IsUrl()
  @IsOptional()
  passportScanUrl?: string;

  @IsString()
  @IsOptional()
  region?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsEnum(VisaType)
  @IsOptional()
  visaType?: VisaType;

  @IsString()
  @IsOptional()
  regSlipNumber?: string;

  @IsUrl()
  @IsOptional()
  regSlipUrl?: string;
}

export class UpdateGuestDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  patronymic?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  citizenship?: string;

  @IsString()
  @IsOptional()
  passportSeries?: string;

  @IsString()
  @IsOptional()
  passportNumber?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string | Date;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @IsString()
  @IsOptional()
  visaNumber?: string;

  @IsDateString()
  @IsOptional()
  dateOfEntry?: string | Date;

  @IsDateString()
  @IsOptional()
  passportIssueDate?: string | Date;

  @IsDateString()
  @IsOptional()
  passportExpiryDate?: string | Date;

  @IsUrl()
  @IsOptional()
  passportScanUrl?: string;

  @IsString()
  @IsOptional()
  region?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsEnum(VisaType)
  @IsOptional()
  visaType?: VisaType;

  @IsString()
  @IsOptional()
  regSlipNumber?: string;

  @IsUrl()
  @IsOptional()
  regSlipUrl?: string;
}
