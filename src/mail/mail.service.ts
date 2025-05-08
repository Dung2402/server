import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendMail(options: { to: string; subject: string; text: string }) {
    return this.mailerService.sendMail({
      to: options.to,
      subject: options.subject,
      text: options.text,
    });
  }
}
