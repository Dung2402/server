import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module'; // 👈 NHỚ import
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, JwtModule.register({
    secret: process.env.ACCESS_SECRET_KEY,  // Hoặc lấy từ ConfigService
    signOptions: { expiresIn: '1h' },  // Cấu hình cho JWT
  }),
  ConfigModule,], // 👈 THÊM VÀO ĐÂY
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
