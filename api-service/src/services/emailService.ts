import nodemailer, { Transporter } from 'nodemailer';

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
      host: process.env['EMAIL_HOST'] || 'smtp.gmail.com',
      port: parseInt(process.env['EMAIL_PORT'] || '587'),
      secure: process.env['EMAIL_SECURE'] === 'true',
      user: process.env['EMAIL_USER'] || '',
      password: process.env['EMAIL_PASSWORD'] || '',
      from: process.env['EMAIL_FROM'] || 'noreply@personaltracker.com',
    };

    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    if (!this.config.user || !this.config.password) {
      console.warn('⚠️  Email configuration not found. Email features will be disabled.');
      return;
    }

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
    const verificationUrl = `${process.env['FRONTEND_URL']}/verify-email?token=${token}`;
    const subject = 'Verify Your Email Address - Personal Tracker';
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Personal Tracker!</h1>
    </div>
    <div class="content">
      <h2>Hi ${name},</h2>
      <p>Thank you for signing up. To complete your registration, please verify your email address by clicking the button below:</p>
      <div style="text-align: center;">
        <a href="${verificationUrl}" class="button">Verify Email Address</a>
      </div>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #4f46e5;">${verificationUrl}</p>
      <p><strong>This verification link will expire in 24 hours.</strong></p>
      <p>If you didn't create an account, please ignore this email.</p>
      <p>Best regards,<br>The Personal Tracker Team</p>
    </div>
    <div class="footer">
      <p>This email was sent to ${email}</p>
      <p>Personal Tracker - Two-Player Daily Goal Game</p>
    </div>
  </div>
</body>
</html>`;

    return await this.sendEmail(email, subject, html);
  }

  public async sendPasswordResetEmail(email: string, name: string, token: string): Promise<boolean> {
    const resetUrl = `${process.env['FRONTEND_URL']}/reset-password?token=${token}`;
    const subject = 'Reset Your Password - Personal Tracker';
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset Request</h1>
    </div>
    <div class="content">
      <h2>Hi ${name},</h2>
      <p>We received a request to reset your password for your Personal Tracker account.</p>
      <div style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </div>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #dc2626;">${resetUrl}</p>
      <div class="warning">
        <p><strong>⚠️ Important Security Information:</strong></p>
        <ul>
          <li>This password reset link will expire in 1 hour</li>
          <li>If you didn't request this reset, please ignore this email</li>
          <li>Never share this link with anyone</li>
        </ul>
      </div>
      <p>If you continue to have problems, please contact our support team.</p>
      <p>Best regards,<br>The Personal Tracker Team</p>
    </div>
    <div class="footer">
      <p>This email was sent to ${email}</p>
      <p>Personal Tracker - Two-Player Daily Goal Game</p>
    </div>
  </div>
</body>
</html>`;

    return await this.sendEmail(email, subject, html);
  }

  public async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const subject = 'Welcome to Personal Tracker! 🎉';
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .feature { background: white; padding: 20px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #4f46e5; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to Personal Tracker!</h1>
      <p>Your daily goal tracking journey starts here</p>
    </div>
    <div class="content">
      <h2>Hi ${name},</h2>
      <p>Congratulations! You've successfully joined Personal Tracker.</p>
      <div class="feature">
        <h3>📊 Track Your Goals</h3>
        <p>Set daily goals and track your progress with our intuitive calendar interface.</p>
      </div>
      <div class="feature">
        <h3>🎮 Two-Player Game</h3>
        <p>Compete with your partner and stay motivated together!</p>
      </div>
      <div class="feature">
        <h3>⏱️ Session Management</h3>
        <p>Start, pause, and resume your sessions with countdown timers.</p>
      </div>
      <div style="text-align: center;">
        <a href="${process.env['FRONTEND_URL']}" class="button">Start Tracking Now</a>
      </div>
      <p>If you have any questions, don't hesitate to reach out.</p>
      <p>Happy tracking!<br>The Personal Tracker Team</p>
    </div>
    <div class="footer">
      <p>This email was sent to ${email}</p>
      <p>Personal Tracker - Two-Player Daily Goal Game</p>
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
