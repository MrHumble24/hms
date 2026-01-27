import { IsNotEmpty, IsObject } from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty()
  @IsObject()
  name: Record<string, string>;
}

export class UpdateCategoryDto {
  @IsObject()
  name?: Record<string, string>;
}
