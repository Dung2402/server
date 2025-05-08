import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Put,
    Delete,
    Req,
    Res,
    Patch,
    Query,
  } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ChangePassDto } from './dto/change-pass';
import { Response,Request } from 'express';
  
  @Controller('users')
  export class UsersController {
    constructor(private readonly usersService: UsersService) {}
  
    @Post('register')
    create(@Body() createUserDto: CreateUserDto) {
      return this.usersService.register(createUserDto);
    }
    
    @Post('login')
    login(@Body() loginUserDto: LoginUserDto, @Res() res: Response , @Req() req: Request) {
      return this.usersService.login(loginUserDto, res , req);
    }
    @Get('current')
        async getCurrentUser(@Req() req: Request,@Res() res: Response) {
          return this.usersService.currentUser(req ,res); 
        }        
    @Post('change-password')
        changePass(@Req() req: Request, @Body() changePassDto: ChangePassDto, @Res() res: Response) {
          return this.usersService.changePass(req, changePassDto, res);
        }
     @Delete('delete-account')
        async deleteAccount(@Req() req: Request, @Res() res: Response) {
          return this.usersService.deleteAccount(req, res);
        }

        @Patch(':id')
        async updateUser(
          @Param('id') id: string,
          @Body() updateUserDto: UpdateUserDto,
        ) {
          return this.usersService.updateUser(id, updateUserDto);
        }

        @Get('search')
        async searchUsers(@Query('email') email: string) {
          return this.usersService.searchUsersByEmail(email);
        }
        
  }
  