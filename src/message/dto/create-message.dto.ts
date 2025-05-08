// src/message/dto/create-message.dto.ts
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { MessageType, MessageStatus } from '@prisma/client';

export class CreateMessageDto {
  @IsUUID()
  chatId: string;

  @IsUUID()
  senderId: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsUUID()
  repliedMessageId?: string;

  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @IsOptional()
  attachments?: any;

  @IsOptional()
  @IsEnum(MessageStatus)
  status?: MessageStatus;
}
