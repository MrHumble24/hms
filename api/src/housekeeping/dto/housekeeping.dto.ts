import {
  IsEnum,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { TaskStatus, Priority, HousekeepingTaskType } from '@prisma/client';

export class CreateHousekeepingTaskDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  roomId: string;

  @IsString()
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsEnum(HousekeepingTaskType)
  @IsNotEmpty()
  taskType: HousekeepingTaskType;

  @IsDateString()
  @IsOptional()
  scheduledFor?: string | Date;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateHousekeepingTaskDto {
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsString()
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  @IsUUID()
  completerId?: string;
}
