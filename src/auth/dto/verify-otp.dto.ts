import { IsEmail, Length } from 'class-validator';

export class VerifyOtpDto {


  @Length(6, 6)
  otp: string;
}
