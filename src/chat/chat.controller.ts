import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateOneToOneChatDto } from './dto/create-one-to-one.dto';
import { CreateGroupChatDto } from './dto/create-group-chat.dto';

@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('one-to-one')
  createOneToOneChat(@Body() body: { userIDA: string }, @Req() req) {
    return this.chatService.createOneToOneChat(body.userIDA, req);
  }
  @Post('create/group')
  async createGroupChat(
    @Body() body: { name: string; userIds: string[] },
    @Req() req
  ) {
    return this.chatService.createGroupChat( body.name, body.userIds,req);
  }

  @Get('my-groups')
getMyGroupChats(@Req() req) {
  return this.chatService.getMyGroupChats(req);
}
}
