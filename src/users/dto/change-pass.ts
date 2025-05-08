import { IsString } from 'class-validator';

export class ChangePassDto {
    @IsString()
    oldPassword: string;
  @IsString()
  newPassword: string;
}