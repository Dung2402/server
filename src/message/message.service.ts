// src/message/message.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessageService {
  constructor(private prisma: PrismaService) {}

  async createWithSender(dto: CreateMessageDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.senderId },
    });

    if (!user) throw new Error(`User with ID ${dto.senderId} not found`);

    // Kiểm tra chat có tồn tại chưa, nếu chưa thì tạo
    await this.prisma.chat.upsert({
      where: { id: dto.chatId },
      create: { id: dto.chatId },
      update: {},
    });

    const message = await this.prisma.message.create({
      data: {
        chatId: dto.chatId,
        senderId: dto.senderId,
        content: dto.content,
        repliedMessageId: dto.repliedMessageId,
        type: dto.type,
        attachments: dto.attachments,
        status: dto.status,
      },
      include: {
        sender: {
          select: { name: true },
        },
      },
    });

    return message;
  }

  async findByChat(chatId: string) {
    return this.prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            name: true,
          },
        },
      },
    });
  }
}
