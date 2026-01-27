import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class RegisterGuestDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  bookingId: string;
}
