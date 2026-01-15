import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { redisInstance } from 'src/utils/redis';

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT),
      secure: Number(process.env.MAIL_PORT) === 465, // True for 465, false for other ports
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendTwoFactorCode(email: string, code: string) {
    const cooldownKey = `mail_cooldown:${email}`;

    const result = await redisInstance.set(cooldownKey, 'true', 'EX', 10, 'NX');

    if (result !== 'OK') {
      return;
    }

    if (
      !process.env.MAIL_HOST ||
      process.env.MAIL_HOST === 'smtp.example.com'
    ) {
      console.log(`[Mock Mail] To: ${email}, Code: ${code}`);
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #F1F5F9;
            margin: 0;
            padding: 0;
            color: #0F172A;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            padding: 20px;
          }
          .card {
            background-color: #FFFFFF;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            padding: 40px;
            text-align: center;
          }
          .header {
            margin-bottom: 30px;
          }
          .title {
            color: #CC002C; /* Brand Color */
            font-size: 24px;
            font-weight: bold;
            margin: 0;
          }
          .subtitle {
            color: #64748B;
            font-size: 16px;
            margin-top: 8px;
          }
          .code-container {
            background-color: #FFF1F2;
            border: 1px solid #FECDD3;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
            display: inline-block;
          }
          .code {
            color: #CC002C;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            margin: 0;
            font-family: monospace;
          }
          .message {
            color: #334155;
            font-size: 16px;
            line-height: 1.5;
            margin-bottom: 30px;
          }
          .footer {
            margin-top: 30px;
            color: #94A3B8;
            font-size: 12px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <h1 class="title">KeuzeKompas</h1>
              <p class="subtitle">Secure Login Verification</p>
            </div>
            
            <p class="message">
              Hello,
              <br><br>
              Use the verification code below to complete your login.
              <br>
              This code will expire in 5 minutes.
            </p>

            <div class="code-container">
              <p class="code">${code}</p>
            </div>

            <p class="message" style="font-size: 14px; color: #64748B;">
              If you did not attempt to login, please ignore this email.
            </p>
          </div>
          
          <div class="footer">
            &copy; ${new Date().getFullYear()} Avans Hogeschool. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.MAIL_FROM,
        to: email,
        subject: 'KeuzeKompas Verification Code',
        text: `Your verification code is: ${code}`,
        html: htmlContent,
      });
    } catch (error) {
      await redisInstance.del(cooldownKey);
      throw error;
    }
  }
}
