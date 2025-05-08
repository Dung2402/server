import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from 'src/mail/mail.service';
import * as bcrypt from 'bcryptjs'
import { log } from 'console';
import { OAuth2Client } from 'google-auth-library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);  // Thay bằng client ID của bạn
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private readonly jwtService: JwtService, 
    private readonly configService: ConfigService,
  ) {}
  
  async sendOtp(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    // Tạo OTP và lưu vào DB
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.prisma.user.update({
      where: { email },
      data: { 
        otpCode: otp,
        otpExpires: new Date(Date.now() + 5 * 60 * 1000), // Hết hạn sau 5 phút
      },
    });

    // Tạo JWT token chứa email (không chứa OTP)
    const token = this.jwtService.sign(
      { email }, 
      { expiresIn: '10m' }, // Token hết hạn sau 10 phút
    );

    return { 
      message: 'OTP đã được gửi qua email (mô phỏng)',
      token, // Trả token cho client
    };
  }

  async resetPassword(
    newPassword: string,
    confirmPassword: string,
    token: string,
  ) {
    // Giải mã token để lấy email
    let email: string;
    try {
      const payload = this.jwtService.verify(token);
      email = payload.email;
    } catch (error) {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }

    // Kiểm tra mật khẩu trùng khớp
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Mật khẩu không khớp');
    }

    // Hash mật khẩu mới và lưu vào DB
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { email },
      data: { 
        password: hashedPassword,
        otpCode: null, // Xóa OTP sau khi đổi mật khẩu
        otpExpires: null,
      },
    });

    return { message: 'Đặt lại mật khẩu thành công' };
  }
  async verifyOtp(otp: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        otpCode: otp,
        otpExpires: { gte: new Date() }, // Kiểm tra xem OTP có còn hiệu lực không
      },
    });

    if (!user) {
      throw new BadRequestException('OTP không hợp lệ hoặc đã hết hạn');
    }

    return { message: 'OTP hợp lệ' };
  }
  async googleLogin(token: string) {
    try {
      // Xác minh ID Token từ Google
      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();  // Lấy payload từ Google
      if (!payload) {
        throw new Error('Unable to parse Google token payload');
      }

      const email = payload.email ?? '';  // Sử dụng toán tử ?? để cung cấp giá trị mặc định nếu email là undefined
      const { sub, picture } = payload;
      
      // Kiểm tra xem name có tồn tại trong payload không
      const name = payload.name || 'Unknown';  // Nếu không có name thì gán mặc định là 'Unknown'

      // Kiểm tra người dùng trong database
      let user = await this.prisma.user.findUnique({
        where: { email },
      });

      
      // Tạo JWT token cho người dùng
      if(user) {
        const payloadJWT = { sub: user.id };
        const accessToken = this.jwtService.sign(payloadJWT, {
          secret: this.configService.get<string>('ACCESS_SECRET_KEY'),
          expiresIn: '1h',
        });
  
        return { access_token: accessToken };
      }
    } catch (error) {
      throw new Error('Google login failed: ' + error.message);
    }
  }
}
