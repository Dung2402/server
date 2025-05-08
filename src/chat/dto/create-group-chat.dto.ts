import { IsString, IsUUID, IsArray, ArrayMinSize } from 'class-validator';

export class CreateGroupChatDto {
  @IsUUID()
  creatorId: string;

  @IsString()
  name: string;

  @IsArray()
  @ArrayMinSize(2, { message: 'Group must have at least 3 members including creator' })
  @IsUUID(undefined, { each: true })
  memberIds: string[];
}
