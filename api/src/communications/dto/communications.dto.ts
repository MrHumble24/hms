import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import {
  CommunicationType,
  CommunicationChannel,
  CommunicationStatus,
} from '@prisma/client';

export class CreateCommunicationDto {
  @IsUUID()
  guestId: string;

  @IsUUID()
  @IsOptional()
  bookingId?: string;

  @IsEnum(CommunicationType)
  type: CommunicationType;

  @IsEnum(CommunicationChannel)
  channel: CommunicationChannel;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  content: string;
}

export class UpdateCommunicationStatusDto {
  @IsEnum(CommunicationStatus)
  status: CommunicationStatus;
}

export class QueryCommunicationsDto {
  @IsUUID()
  @IsOptional()
  guestId?: string;

  @IsUUID()
  @IsOptional()
  bookingId?: string;

  @IsEnum(CommunicationType)
  @IsOptional()
  type?: CommunicationType;

  @IsEnum(CommunicationChannel)
  @IsOptional()
  channel?: CommunicationChannel;

  @IsEnum(CommunicationStatus)
  @IsOptional()
  status?: CommunicationStatus;
}
