import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MailModule } from 'src/mail/mail.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { GoogleStrategy } from './google.strategy';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, MailModule  ,ConfigModule, PassportModule.register({ defaultStrategy: 'google' }),
    JwtModule.register({
      secret: 'your-secret-key', // Thay 'your-secret-key' bằng khóa bí mật của bạn
      signOptions: { expiresIn: '1h' },
    }),],
  controllers: [AuthController],
  providers: [AuthService , GoogleStrategy],
})
export class AuthModule {}
