import { IsString,IsOptional } from 'class-validator';

export class LoginUserDto {
  
  @IsString()
  email: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}