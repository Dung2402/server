import { IsUUID } from 'class-validator';

export class CreateOneToOneChatDto {
  @IsUUID()
  userA: string;
}
  