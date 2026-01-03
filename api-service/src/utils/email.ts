import emailService from '../services/emailService';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  return await emailService.sendEmail(
    options.to,
    options.subject,
    options.html,
    options.text
  );
}
