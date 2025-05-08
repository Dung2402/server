import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService ,private readonly jwtService: JwtService ,private configService: ConfigService) {}

  async createOneToOneChat(userAId: string, req) {
    const token = req.cookies['access_token'];
    if (!token) {
      throw new UnauthorizedException('Token not provided');
    }
  
    const decoded = this.jwtService.verify(token, {
      secret: this.configService.get<string>('ACCESS_SECRET_KEY'),
    });
    const userId = decoded.sub;
  
    // Kiểm tra sự tồn tại của cả 2 người
    const users = await this.prisma.user.findMany({
      where: { id: { in: [userAId, userId] } },
    });
  
    if (users.length < 2) {
      throw new Error('1 hoặc 2 người dùng không tồn tại');
    }
  
    // Kiểm tra xem đã có chat 1-1 giữa 2 người này chưa
    const existingChat = await this.prisma.chat.findFirst({
      where: {
        isGroup: false,
        participants: {
          every: {
            userId: { in: [userAId, userId] },
          },
        },
      },
      include: { participants: true },
    });
  
    if (existingChat && existingChat.participants.length === 2) {
      return existingChat;
    }
  
    // Tạo mới chat 1-1
    return this.prisma.chat.create({
      data: {
        isGroup: false,
        participants: {
          create: [
            { userId: userId },
            { userId: userAId },
          ],
        },
      },
      include: { participants: true },
    });
  }
  async createGroupChat( name: string, userIds: string[],req) {
    const token = req.cookies['access_token'];
    if (!token) {
      throw new UnauthorizedException('Token not provided');
    }
  
    const decoded = this.jwtService.verify(token, {
      secret: this.configService.get<string>('ACCESS_SECRET_KEY'),
    });
    const creatorId = decoded.sub;
  
    // Loại bỏ trùng và thêm người tạo vào danh sách
    const allUserIds = Array.from(new Set([...userIds, creatorId]));
  
    // Kiểm tra ít nhất 2 thành viên
    if (allUserIds.length < 2) {
      throw new Error('Group chat phải có ít nhất 2 thành viên');
    }
  
    // Kiểm tra sự tồn tại của user
    const foundUsers = await this.prisma.user.findMany({
      where: { id: { in: allUserIds } },
    });
  
    if (foundUsers.length !== allUserIds.length) {
      throw new Error('Một hoặc nhiều user không tồn tại');
    }
  
    // Tạo group chat
    return this.prisma.chat.create({
      data: {
        isGroup: true,
        name,
        participants: {
          create: allUserIds.map((userId) => ({ userId })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }
  
async getMyGroupChats(req) {
  const token = req.cookies['access_token'];
  if (!token) {
    throw new UnauthorizedException('Token not provided');
  }

  const decoded = this.jwtService.verify(token, {
    secret: this.configService.get<string>('ACCESS_SECRET_KEY'),
  });
  const userId = decoded.sub;

  const groupChats = await this.prisma.chat.findMany({
    where: {
      participants: {
        some: {
          userId: userId,
        },
      },
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return groupChats;
}

}
