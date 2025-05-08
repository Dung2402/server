import { ConfigService } from '@nestjs/config';
import { Response } from 'express'; 
import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Prisma } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';
import {generateAccessToken} from './tokens/generateAccessToken'
import {generateRefreshToken} from './tokens/generateRefreshToken'
import * as bcrypt from 'bcryptjs'
import { Request } from 'express';
import { LoginUserDto } from './dto/login-user.dto';
import * as jwt from 'jsonwebtoken';
import { ChangePassDto } from './dto/change-pass';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { JwtService } from '@nestjs/jwt';
import { av } from '@upstash/redis/zmscore-CjoCv9kz';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(5, '1m'),
  analytics: true,    
});
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService ,private configService: ConfigService ,private readonly jwtService: JwtService) {}


  
  async register(data: CreateUserDto) {
    console.log('Registering user:', data);
  
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      return { status: 409, Email: 'Email này đã tồn tại' };
    }
  
    const name = data.name || this.generateRandomName();
    const hashedPassword = await bcrypt.hash(data.password, 10);
  
    const avatar = data.avatar || this.generateRandomAvatar(); // 👈 thêm dòng này
  
    const newUser = await this.prisma.user.create({
      data: {
        name,
        email: data.email,
        password: hashedPassword,
        avatar,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
      },
    });
  
    const accessToken = generateAccessToken(newUser.id);
    const refreshToken = generateRefreshToken(newUser.id);
  
    return {
      user : newUser,
      accessToken : accessToken,
      refreshToken : refreshToken,
    };
  }
  
  generateRandomAvatar(): string {
    const seed = Math.random().toString(36).substring(2, 10);
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
  }




  async login(data: LoginUserDto, res: Response , req: Request) {
    console.log('Login attempt:', data);
    
    const ip = (req.headers['x-forwarded-for'] as string) || 'unknown';
    try {
      const { success, remaining, reset } = await ratelimit.limit(ip);
      if (!success) {
        return res.status(429).json({
          message: 'Số lần đăng nhập vượt quá giới hạn, hãy thử lại sau.',
        });
      }
    } catch (error) {
      console.error('Rate limit check failed:', error);
      }
    
  
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
      select: {
        id: true,
        email: true,
        password: true, // cần để so sánh mật khẩu
        name: true, // nếu bạn có field name
        avatar: true, // nếu bạn có field avatar
      },
    });
  
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }
  
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Sai mật khẩu' });
    }
  
    // Tạo JWT token
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
  
    // Lưu access token và refresh token vào cookie
    res.cookie('access_token', accessToken, {
      httpOnly: true,  // Không cho phép JavaScript truy cập cookie
      secure: process.env.NODE_ENV === 'production', // Chỉ gửi cookie qua HTTPS khi ở môi trường production
      maxAge: 15 * 60 * 1000,  // Thời gian sống của cookie (15 phút)
      path: '/',  // Cookie sẽ có hiệu lực với tất cả các route
    });
  
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000,  // Refresh token có thể sống lâu hơn, ví dụ 30 ngày
      path: '/',
    });
  
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
      message: 'Đăng nhập thành công',
      accessToken:accessToken},);
  } 


  private generateRandomName(): string {
    return 'user_' + Math.random().toString(36).substring(2, 8);
  }


  async updateUser(id: string, data: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
  
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
  
    // Kiểm tra nếu email mới được gửi lên khác với email hiện tại
    if (data.email && data.email !== user.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: data.email },
      });
  
      if (emailExists) {
        throw new BadRequestException('Email đã tồn tại');
      }
    }
  
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        avatar: data.avatar,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        updatedAt: true,
      },
    });
  
    return updatedUser;
  }
  
  
  async currentUser(req, res) {
    const token = req.cookies['access_token']; // 👈 Đọc từ cookie

  console.log('Token from cookie:', token);

  if (!token) {
    throw new UnauthorizedException('Token not provided');
  }

  try {
    const decoded = this.jwtService.verify(token, {
      secret: this.configService.get<string>('ACCESS_SECRET_KEY'),
    });

    const userId = decoded.sub;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
      message: 'Current user retrieved successfully',
    });
  } catch (error) {
    console.error('Token verify error:', error.message);
    throw new UnauthorizedException('Invalid token');
  }
}






async changePass(req: Request, data: ChangePassDto, res: Response) {
  try {
    const token = req.cookies['access_token'];
    if (!token) {
      return res.status(401).json({ message: 'Không tìm thấy token' });
    }
    const decoded = this.jwtService.verify(token, {
      secret: this.configService.get<string>('ACCESS_SECRET_KEY'), // Lấy ACCESS_SECRET_KEY từ config
    });
    const userId = decoded.sub;
    console.log(decoded);
    
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng ' });
    }

    const isOldPasswordCorrect = await bcrypt.compare(data.oldPassword, user.password);
    if (!isOldPasswordCorrect) {
      return res.status(400).json({ message: 'Mật khẩu cũ không đúng' });
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return res.json({ message: 'Đổi mật khẩu thành công' });

  } catch (error) {
    return res.status(500).json({ message: 'Có lỗi xảy ra', error: error.message });
  }
}




async deleteAccount(req: Request, res: Response) {
  const token = req.cookies['access_token'];
  if (!token) {
    throw new UnauthorizedException('Không tìm thấy access token');
  }
console.log('token',token);

  let decoded;
  try {
    decoded = this.jwtService.verify(token, {
      secret: this.configService.get<string>('ACCESS_SECRET_KEY'),
    });
  } catch (error) {
    throw new UnauthorizedException('Token không hợp lệ');
  }

  const userId = decoded.sub;

  const user = await this.prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundException('Người dùng không tồn tại');
  }

  // Cập nhật trạng thái là đã xoá
  await this.prisma.user.update({
    where: { id: userId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });

  // Xoá cookie để logout
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');

  return res.status(200).json({ message: 'Tài khoản đã được xoá (vô hiệu hoá)' });
}


async searchUsersByEmail(email: string) {
  if (!email || email.trim() === '') {
    return [];
  }

  return this.prisma.user.findMany({
    where: {
      email: {
        contains: email,
        mode: 'insensitive', // không phân biệt chữ hoa/thường
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
}



}
