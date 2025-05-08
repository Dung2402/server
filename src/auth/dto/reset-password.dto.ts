import { IsEmail, Length, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  email: string;

  @Length(6, 6)
  otp: string;

  @MinLength(6)
  newPassword: string;
}
