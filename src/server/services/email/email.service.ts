import nodemailer, { type Transporter } from 'nodemailer';
import { emailConfig } from '../../config/email-config';

export class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: emailConfig.smtp.host,
      port: emailConfig.smtp.port,
      secure: emailConfig.smtp.secure,
      auth: {
        user: emailConfig.smtp.auth.user,
        pass: emailConfig.smtp.auth.pass,
      },
    });
  }

  // This should send email for when:
  // 1. Ticket is received
  // 2. Quote is generated
  // 3. Ticket status is updated
  // 4. Ticket is resolved or deleted
  // 5. Ticket is assigned to a support agent/manager

  // Email templates should be designed in ./email/templates
  // Base email template already exists "EmailLayout"
}
