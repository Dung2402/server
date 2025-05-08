import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

@Module({
   imports: [PrismaModule, JwtModule.register({
     secret: process.env.ACCESS_SECRET_KEY,  
     signOptions: { expiresIn: '1h' },  
   }),
   ConfigModule,], 
  providers: [ChatService],
  controllers: [ChatController],
})
export class ChatModule {}
