import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { ConfigModule } from '@nestjs/config';
import { MessageModule } from './message/message.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // <-- quan trọng!
      envFilePath: '.env',
    }),
    MailModule, PrismaModule, UsersModule ,AuthModule, MessageModule,ChatModule// <-- hoặc AuthModule, MailModule, ...
    // các module khác...
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
