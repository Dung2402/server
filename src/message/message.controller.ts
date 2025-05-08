// src/message/message.controller.ts
import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  create(@Body() dto: CreateMessageDto) {
    return this.messageService.createWithSender(dto);
  }

  @Get('chat/:chatId')
  findByChat(@Param('chatId') chatId: string) {
    return this.messageService.findByChat(chatId);
  }
}
