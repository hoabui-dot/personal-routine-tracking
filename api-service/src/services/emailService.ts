import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../env';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private config: EmailConfig;

  constructor() {
    this.config = {
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      secure: env.EMAIL_SECURE,
      user: env.EMAIL_USER,
      password: env.EMAIL_PASSWORD,
      from: env.EMAIL_FROM,
    };

    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: {
        user: this.config.user,
        pass: this.config.password,
      },
    });

    // Verify connection
    this.transporter?.verify(error => {
      if (error) {
        console.error('❌ Email service connection failed:', error);
      } else {
        console.log('✅ Email service connected successfully');
      }
    });
  }

  public async sendEmail(to: string, subject: string, html: string, text?: string): Promise<boolean> {
    if (!this.transporter) {
      console.warn('Email service not configured, skipping email send');
      return false;
    }

    try {
      const mailOptions = {
        from: this.config.from,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${to}:`, result.messageId);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send email to ${to}:`, error);
      return false;
    }
  }

  public async sendVerificationEmail(email: string, name: string, token: string): Promise<boolean> {
    const verificationUrl = `${env.PUBLIC_FRONTEND_URL}/verify-email?token=${token}`;
    const subject = '✨ Verify Your Email - Welcome to Capybara Tracker!';
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6; 
      color: #3E2723; 
      background: linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%);
      margin: 0;
      padding: 20px;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(141, 110, 99, 0.2);
    }
    .header { 
      background: linear-gradient(135deg, #8D6E63 0%, #A1887F 100%);
      color: white; 
      padding: 40px 30px; 
      text-align: center; 
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 10px,
        rgba(255,255,255,0.05) 10px,
        rgba(255,255,255,0.05) 20px
      );
    }
    .capybara-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      position: relative;
      z-index: 1;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      text-shadow: 0 2px 4px rgba(0,0,0,0.2);
      position: relative;
      z-index: 1;
    }
    .content { 
      background: #FAFAFA; 
      padding: 40px 30px; 
    }
    .greeting {
      font-size: 24px;
      font-weight: 600;
      color: #6D4C41;
      margin-bottom: 20px;
    }
    .message {
      font-size: 16px;
      color: #5D4037;
      margin-bottom: 20px;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button { 
      display: inline-block; 
      background: linear-gradient(135deg, #8D6E63 0%, #A1887F 100%);
      color: white; 
      padding: 16px 32px; 
      text-decoration: none; 
      border-radius: 12px; 
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 12px rgba(141, 110, 99, 0.3);
      transition: transform 0.2s;
    }
    .link-box {
      background: white;
      border: 2px solid #D7CCC8;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
      word-break: break-all;
      font-size: 14px;
      color: #8D6E63;
    }
    .info-box { 
      background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
      border-left: 4px solid #2196F3;
      padding: 20px; 
      border-radius: 8px; 
      margin: 25px 0;
      box-shadow: 0 2px 8px rgba(33, 150, 243, 0.1);
    }
    .info-title {
      font-weight: 700;
      color: #1565C0;
      margin-bottom: 10px;
      font-size: 16px;
    }
    .footer { 
      text-align: center; 
      padding: 30px;
      background: white;
      color: #8D6E63; 
      font-size: 14px;
      border-top: 2px solid #EFEBE9;
    }
    .footer-capybara {
      width: 60px;
      height: 60px;
      margin: 0 auto 15px;
      opacity: 0.3;
    }
    .divider {
      height: 2px;
      background: linear-gradient(90deg, transparent, #D7CCC8, transparent);
      margin: 30px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="capybara-icon">
        <svg width="60" height="60" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="32" cy="38" rx="22" ry="18" fill="white" opacity="0.9"/>
          <ellipse cx="32" cy="22" rx="16" ry="14" fill="white"/>
          <ellipse cx="22" cy="14" rx="4" ry="6" fill="white" opacity="0.9"/>
          <ellipse cx="42" cy="14" rx="4" ry="6" fill="white" opacity="0.9"/>
          <circle cx="26" cy="20" r="2.5" fill="#3E2723"/>
          <circle cx="38" cy="20" r="2.5" fill="#3E2723"/>
          <circle cx="26.5" cy="19.5" r="1" fill="white" opacity="0.8"/>
          <circle cx="38.5" cy="19.5" r="1" fill="white" opacity="0.8"/>
          <ellipse cx="32" cy="26" rx="3" ry="2" fill="#6D4C41"/>
          <path d="M 28 28 Q 32 30 36 28" stroke="#6D4C41" stroke-width="1.5" stroke-linecap="round" fill="none"/>
          <ellipse cx="22" cy="52" rx="4" ry="6" fill="white" opacity="0.9"/>
          <ellipse cx="32" cy="54" rx="4" ry="6" fill="white" opacity="0.9"/>
          <ellipse cx="42" cy="52" rx="4" ry="6" fill="white" opacity="0.9"/>
        </svg>
      </div>
      <h1>✨ Welcome to Capybara Tracker!</h1>
    </div>
    
    <div class="content">
      <div class="greeting">Hi ${name}! 👋</div>
      
      <p class="message">
        Welcome aboard! We're so excited to have you join the <strong>Capybara Tracker</strong> family! 🦫💙
      </p>
      
      <p class="message">
        To get started on your goal-tracking journey, please verify your email address by clicking the button below:
      </p>
      
      <div class="button-container">
        <a href="${verificationUrl}" class="button">✅ Verify My Email</a>
      </div>
      
      <p style="text-align: center; color: #8D6E63; font-size: 14px; margin: 20px 0;">
        Or copy and paste this link into your browser:
      </p>
      
      <div class="link-box">${verificationUrl}</div>
      
      <div class="info-box">
        <div class="info-title">📌 Quick Info</div>
        <ul style="margin: 10px 0; padding-left: 20px; color: #1976D2;">
          <li style="margin: 8px 0;">This verification link expires in <strong>24 hours</strong></li>
          <li style="margin: 8px 0;">Once verified, you can start tracking your daily goals</li>
          <li style="margin: 8px 0;">Didn't sign up? You can safely ignore this email</li>
        </ul>
      </div>
      
      <div class="divider"></div>
      
      <p style="color: #6D4C41; font-size: 15px;">
        Ready to achieve your goals with the calmest productivity companion? Let's go! 🎯✨
      </p>
      
      <p style="color: #8D6E63; font-size: 15px; margin-top: 25px;">
        Stay calm and track on,<br>
        <strong>The Capybara Tracker Team</strong> 🦫
      </p>
    </div>
    
    <div class="footer">
      <div class="footer-capybara">
        <svg width="60" height="60" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="60" cy="75" rx="40" ry="30" fill="#8D6E63" opacity="0.5"/>
          <ellipse cx="60" cy="45" rx="28" ry="25" fill="#A1887F" opacity="0.5"/>
          <ellipse cx="45" cy="28" rx="7" ry="10" fill="#8D6E63" opacity="0.5"/>
          <ellipse cx="75" cy="28" rx="7" ry="10" fill="#8D6E63" opacity="0.5"/>
          <path d="M 50 42 Q 52 44 54 42" stroke="#6D4C41" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.5"/>
          <path d="M 66 42 Q 68 44 70 42" stroke="#6D4C41" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.5"/>
          <ellipse cx="60" cy="52" rx="5" ry="3" fill="#6D4C41" opacity="0.5"/>
          <path d="M 52 58 Q 60 62 68 58" stroke="#6D4C41" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.5"/>
        </svg>
      </div>
      <p style="margin: 5px 0; color: #A1887F;">This email was sent to <strong>${email}</strong></p>
      <p style="margin: 5px 0; color: #8D6E63; font-weight: 600;">Capybara Tracker - Your Daily Goal Companion 🦫</p>
      <p style="margin: 15px 0 5px; color: #BCAAA4; font-size: 12px;">
        © ${new Date().getFullYear()} Capybara Tracker. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`;

    return await this.sendEmail(email, subject, html);
  }

  public async sendPasswordResetEmail(email: string, name: string, token: string): Promise<boolean> {
    const resetUrl = `${env.PUBLIC_FRONTEND_URL}/reset-password?token=${token}`;
    const subject = '🔐 Reset Your Password - Capybara Tracker';
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6; 
      color: #3E2723; 
      background: linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%);
      margin: 0;
      padding: 20px;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(141, 110, 99, 0.2);
    }
    .header { 
      background: linear-gradient(135deg, #8D6E63 0%, #A1887F 100%);
      color: white; 
      padding: 40px 30px; 
      text-align: center; 
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 10px,
        rgba(255,255,255,0.05) 10px,
        rgba(255,255,255,0.05) 20px
      );
    }
    .capybara-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      position: relative;
      z-index: 1;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      text-shadow: 0 2px 4px rgba(0,0,0,0.2);
      position: relative;
      z-index: 1;
    }
    .content { 
      background: #FAFAFA; 
      padding: 40px 30px; 
    }
    .greeting {
      font-size: 24px;
      font-weight: 600;
      color: #6D4C41;
      margin-bottom: 20px;
    }
    .message {
      font-size: 16px;
      color: #5D4037;
      margin-bottom: 30px;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button { 
      display: inline-block; 
      background: linear-gradient(135deg, #8D6E63 0%, #A1887F 100%);
      color: white; 
      padding: 16px 32px; 
      text-decoration: none; 
      border-radius: 12px; 
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 12px rgba(141, 110, 99, 0.3);
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(141, 110, 99, 0.4);
    }
    .link-box {
      background: white;
      border: 2px solid #D7CCC8;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
      word-break: break-all;
      font-size: 14px;
      color: #8D6E63;
    }
    .warning { 
      background: linear-gradient(135deg, #FFF9C4 0%, #FFF59D 100%);
      border-left: 4px solid #F57C00;
      padding: 20px; 
      border-radius: 8px; 
      margin: 25px 0;
      box-shadow: 0 2px 8px rgba(245, 124, 0, 0.1);
    }
    .warning-title {
      font-weight: 700;
      color: #E65100;
      margin-bottom: 10px;
      font-size: 16px;
    }
    .warning ul {
      margin: 10px 0;
      padding-left: 20px;
      color: #F57C00;
    }
    .warning li {
      margin: 8px 0;
    }
    .footer { 
      text-align: center; 
      padding: 30px;
      background: white;
      color: #8D6E63; 
      font-size: 14px;
      border-top: 2px solid #EFEBE9;
    }
    .footer-capybara {
      width: 60px;
      height: 60px;
      margin: 0 auto 15px;
      opacity: 0.3;
    }
    .divider {
      height: 2px;
      background: linear-gradient(90deg, transparent, #D7CCC8, transparent);
      margin: 30px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="capybara-icon">
        <svg width="60" height="60" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="32" cy="38" rx="22" ry="18" fill="white" opacity="0.9"/>
          <ellipse cx="32" cy="22" rx="16" ry="14" fill="white"/>
          <ellipse cx="22" cy="14" rx="4" ry="6" fill="white" opacity="0.9"/>
          <ellipse cx="42" cy="14" rx="4" ry="6" fill="white" opacity="0.9"/>
          <circle cx="26" cy="20" r="2.5" fill="#3E2723"/>
          <circle cx="38" cy="20" r="2.5" fill="#3E2723"/>
          <circle cx="26.5" cy="19.5" r="1" fill="white" opacity="0.8"/>
          <circle cx="38.5" cy="19.5" r="1" fill="white" opacity="0.8"/>
          <ellipse cx="32" cy="26" rx="3" ry="2" fill="#6D4C41"/>
          <path d="M 28 28 Q 32 30 36 28" stroke="#6D4C41" stroke-width="1.5" stroke-linecap="round" fill="none"/>
          <ellipse cx="22" cy="52" rx="4" ry="6" fill="white" opacity="0.9"/>
          <ellipse cx="32" cy="54" rx="4" ry="6" fill="white" opacity="0.9"/>
          <ellipse cx="42" cy="52" rx="4" ry="6" fill="white" opacity="0.9"/>
        </svg>
      </div>
      <h1>🔐 Password Reset Request</h1>
    </div>
    
    <div class="content">
      <div class="greeting">Hi ${name}! 👋</div>
      
      <p class="message">
        We received a request to reset your password for your <strong>Capybara Tracker</strong> account. 
        Don't worry, we're here to help you get back on track! 🌟
      </p>
      
      <p class="message">
        Click the button below to create a new password and continue your goal-tracking journey:
      </p>
      
      <div class="button-container">
        <a href="${resetUrl}" class="button">🔑 Reset My Password</a>
      </div>
      
      <p style="text-align: center; color: #8D6E63; font-size: 14px; margin: 20px 0;">
        Or copy and paste this link into your browser:
      </p>
      
      <div class="link-box">${resetUrl}</div>
      
      <div class="warning">
        <div class="warning-title">⚠️ Important Security Information</div>
        <ul>
          <li><strong>This link expires in 1 hour</strong> for your security</li>
          <li>If you didn't request this reset, you can safely ignore this email</li>
          <li>Never share this link with anyone - keep it private!</li>
          <li>Your current password remains active until you complete the reset</li>
        </ul>
      </div>
      
      <div class="divider"></div>
      
      <p style="color: #6D4C41; font-size: 15px;">
        Need help? Our friendly capybara support team is always here for you! 🦫💙
      </p>
      
      <p style="color: #8D6E63; font-size: 15px; margin-top: 25px;">
        Stay calm and track on,<br>
        <strong>The Capybara Tracker Team</strong> 🎯
      </p>
    </div>
    
    <div class="footer">
      <div class="footer-capybara">
        <svg width="60" height="60" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="60" cy="75" rx="40" ry="30" fill="#8D6E63" opacity="0.5"/>
          <ellipse cx="60" cy="45" rx="28" ry="25" fill="#A1887F" opacity="0.5"/>
          <ellipse cx="45" cy="28" rx="7" ry="10" fill="#8D6E63" opacity="0.5"/>
          <ellipse cx="75" cy="28" rx="7" ry="10" fill="#8D6E63" opacity="0.5"/>
          <path d="M 50 42 Q 52 44 54 42" stroke="#6D4C41" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.5"/>
          <path d="M 66 42 Q 68 44 70 42" stroke="#6D4C41" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.5"/>
          <ellipse cx="60" cy="52" rx="5" ry="3" fill="#6D4C41" opacity="0.5"/>
          <path d="M 52 58 Q 60 62 68 58" stroke="#6D4C41" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.5"/>
        </svg>
      </div>
      <p style="margin: 5px 0; color: #A1887F;">This email was sent to <strong>${email}</strong></p>
      <p style="margin: 5px 0; color: #8D6E63; font-weight: 600;">Capybara Tracker - Your Daily Goal Companion 🦫</p>
      <p style="margin: 15px 0 5px; color: #BCAAA4; font-size: 12px;">
        © ${new Date().getFullYear()} Capybara Tracker. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`;

    return await this.sendEmail(email, subject, html);
  }

  public async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const subject = '🎉 Welcome to Capybara Tracker - Let\'s Get Started!';
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6; 
      color: #3E2723; 
      background: linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%);
      margin: 0;
      padding: 20px;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(141, 110, 99, 0.2);
    }
    .header { 
      background: linear-gradient(135deg, #8D6E63 0%, #A1887F 100%);
      color: white; 
      padding: 50px 30px; 
      text-align: center; 
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 10px,
        rgba(255,255,255,0.05) 10px,
        rgba(255,255,255,0.05) 20px
      );
    }
    .capybara-hero {
      width: 100px;
      height: 100px;
      margin: 0 auto 20px;
      position: relative;
      z-index: 1;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
      text-shadow: 0 2px 4px rgba(0,0,0,0.2);
      position: relative;
      z-index: 1;
    }
    .header p {
      margin: 10px 0 0 0;
      font-size: 18px;
      opacity: 0.95;
      position: relative;
      z-index: 1;
    }
    .content { 
      background: #FAFAFA; 
      padding: 40px 30px; 
    }
    .greeting {
      font-size: 26px;
      font-weight: 600;
      color: #6D4C41;
      margin-bottom: 20px;
      text-align: center;
    }
    .message {
      font-size: 16px;
      color: #5D4037;
      margin-bottom: 30px;
      text-align: center;
    }
    .feature { 
      background: white; 
      padding: 25px; 
      margin: 20px 0; 
      border-radius: 12px; 
      border-left: 5px solid #8D6E63;
      box-shadow: 0 2px 8px rgba(141, 110, 99, 0.1);
      transition: transform 0.2s;
    }
    .feature:hover {
      transform: translateX(5px);
    }
    .feature-icon {
      font-size: 40px;
      margin-bottom: 10px;
    }
    .feature h3 {
      margin: 0 0 10px 0;
      font-size: 20px;
      color: #6D4C41;
    }
    .feature p {
      margin: 0;
      color: #8D6E63;
      font-size: 15px;
    }
    .button-container {
      text-align: center;
      margin: 40px 0;
    }
    .button { 
      display: inline-block; 
      background: linear-gradient(135deg, #8D6E63 0%, #A1887F 100%);
      color: white; 
      padding: 18px 40px; 
      text-decoration: none; 
      border-radius: 12px; 
      font-weight: 600;
      font-size: 18px;
      box-shadow: 0 4px 12px rgba(141, 110, 99, 0.3);
    }
    .footer { 
      text-align: center; 
      padding: 30px;
      background: white;
      color: #8D6E63; 
      font-size: 14px;
      border-top: 2px solid #EFEBE9;
    }
    .footer-capybara {
      width: 60px;
      height: 60px;
      margin: 0 auto 15px;
      opacity: 0.3;
    }
    .divider {
      height: 2px;
      background: linear-gradient(90deg, transparent, #D7CCC8, transparent);
      margin: 30px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="capybara-hero">
        <svg width="100" height="100" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="40" cy="48" rx="28" ry="22" fill="white" opacity="0.95"/>
          <ellipse cx="40" cy="28" rx="20" ry="18" fill="white"/>
          <ellipse cx="28" cy="18" rx="5" ry="8" fill="white" opacity="0.9"/>
          <ellipse cx="52" cy="18" rx="5" ry="8" fill="white" opacity="0.9"/>
          <circle cx="33" cy="26" r="3" fill="#3E2723"/>
          <circle cx="47" cy="26" r="3" fill="#3E2723"/>
          <circle cx="33.5" cy="25" r="1.2" fill="white" opacity="0.9"/>
          <circle cx="47.5" cy="25" r="1.2" fill="white" opacity="0.9"/>
          <ellipse cx="40" cy="33" rx="4" ry="2.5" fill="#6D4C41"/>
          <path d="M 35 35 Q 40 38 45 35" stroke="#6D4C41" stroke-width="2" stroke-linecap="round" fill="none"/>
          <ellipse cx="28" cy="65" rx="5" ry="8" fill="white" opacity="0.9"/>
          <ellipse cx="40" cy="68" rx="5" ry="8" fill="white" opacity="0.9"/>
          <ellipse cx="52" cy="65" rx="5" ry="8" fill="white" opacity="0.9"/>
        </svg>
      </div>
      <h1>🎉 Welcome to Capybara Tracker!</h1>
      <p>Your calm productivity journey starts now</p>
    </div>
    
    <div class="content">
      <div class="greeting">Hi ${name}! 👋</div>
      
      <p class="message">
        Congratulations! You've successfully joined the <strong>Capybara Tracker</strong> family! 🦫💙<br>
        We're thrilled to help you achieve your goals with the calmest productivity companion ever!
      </p>
      
      <div class="feature">
        <div class="feature-icon">📊</div>
        <h3>Track Your Goals</h3>
        <p>Set daily goals and track your progress with our beautiful, intuitive calendar interface. Stay organized and motivated!</p>
      </div>
      
      <div class="feature">
        <div class="feature-icon">🎮</div>
        <h3>Two-Player Game Mode</h3>
        <p>Compete with your partner, friend, or colleague! Stay motivated together and celebrate each other's wins!</p>
      </div>
      
      <div class="feature">
        <div class="feature-icon">⏱️</div>
        <h3>Smart Session Management</h3>
        <p>Start, pause, and resume your sessions with countdown timers. Perfect for focused work sessions!</p>
      </div>
      
      <div class="feature">
        <div class="feature-icon">🧠</div>
        <h3>Mind Map Notes</h3>
        <p>Organize your thoughts with interactive mind maps. Visualize your ideas and plans beautifully!</p>
      </div>
      
      <div class="button-container">
        <a href="${env.PUBLIC_FRONTEND_URL}" class="button">🚀 Start Tracking Now</a>
      </div>
      
      <div class="divider"></div>
      
      <p style="color: #6D4C41; font-size: 15px; text-align: center;">
        Need help getting started? Check out our dashboard and explore all the features! 🌟
      </p>
      
      <p style="color: #8D6E63; font-size: 15px; margin-top: 25px; text-align: center;">
        Stay calm and track on,<br>
        <strong>The Capybara Tracker Team</strong> 🦫
      </p>
    </div>
    
    <div class="footer">
      <div class="footer-capybara">
        <svg width="60" height="60" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="60" cy="75" rx="40" ry="30" fill="#8D6E63" opacity="0.5"/>
          <ellipse cx="60" cy="45" rx="28" ry="25" fill="#A1887F" opacity="0.5"/>
          <ellipse cx="45" cy="28" rx="7" ry="10" fill="#8D6E63" opacity="0.5"/>
          <ellipse cx="75" cy="28" rx="7" ry="10" fill="#8D6E63" opacity="0.5"/>
          <path d="M 50 42 Q 52 44 54 42" stroke="#6D4C41" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.5"/>
          <path d="M 66 42 Q 68 44 70 42" stroke="#6D4C41" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.5"/>
          <ellipse cx="60" cy="52" rx="5" ry="3" fill="#6D4C41" opacity="0.5"/>
          <path d="M 52 58 Q 60 62 68 58" stroke="#6D4C41" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.5"/>
        </svg>
      </div>
      <p style="margin: 5px 0; color: #A1887F;">This email was sent to <strong>${email}</strong></p>
      <p style="margin: 5px 0; color: #8D6E63; font-weight: 600;">Capybara Tracker - Your Daily Goal Companion 🦫</p>
      <p style="margin: 15px 0 5px; color: #BCAAA4; font-size: 12px;">
        © ${new Date().getFullYear()} Capybara Tracker. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`;

    return await this.sendEmail(email, subject, html);
  }
}

// Export singleton instance
const emailService = new EmailService();
export default emailService;
