import { Controller, Post, Body, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleAuthGuard } from './google-auth.guard';
import { Request, Response } from 'express';
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)  // Bước 1: Redirect người dùng đến Google OAuth
  async googleAuth(@Req() req) {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)  // Bước 2: Xử lý callback từ Google sau khi người dùng đăng nhập
  googleAuthRedirect(@Req() req, @Res() res: Response) {
    // Sau khi xác thực thành công từ Google, chúng ta sẽ trả về thông tin người dùng và chuyển hướng.
    return res.redirect('http://localhost:3000/dashboard'); // Địa chỉ muốn chuyển hướng sau khi đăng nhập thành công
  }



  @Post('send-otp')
  sendOtp(@Body() dto: SendOtpDto) {
    console.log('Sending OTP to email:', dto.email);
    return this.authService.sendOtp(dto.email);
  }

  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp( dto.otp);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.email, dto.otp, dto.newPassword);
  }
}
