import nodemailer, { type Transporter } from 'nodemailer';
import { emailConfig } from '../../config/email-config.js';
import { ticketReceivedEmail } from './templates/TicketReceivedEmail.js';
import { quoteGeneratedEmail } from './templates/QuoteGeneratedEmail.js';
import { ticketResolvedEmail } from './templates/TicketResolvedEmail.js';
import type {
  NotifyTicketReceivedData,
  NotifyQuoteGeneratedData,
  NotifyTicketResolvedData,
  NotificationResult,
} from '../notification/notification.types.js';

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

  async sendTicketReceived(data: NotifyTicketReceivedData): Promise<NotificationResult> {
    return this.send({
      to: data.userEmail,
      subject: `Ticket Received: ${data.ticketTitle}`,
      html: ticketReceivedEmail(data),
    });
  }

  async sendQuoteGenerated(data: NotifyQuoteGeneratedData): Promise<NotificationResult> {
    return this.send({
      to: data.userEmail,
      subject: `Quote Generated for: ${data.ticketTitle}`,
      html: quoteGeneratedEmail(data),
    });
  }

  async sendTicketResolved(data: NotifyTicketResolvedData): Promise<NotificationResult> {
    return this.send({
      to: data.userEmail,
      subject: `Ticket Resolved: ${data.ticketTitle}`,
      html: ticketResolvedEmail(data),
    });
  }

  private async send(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<NotificationResult> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const info = await this.transporter.sendMail({
        from: emailConfig.smtp.auth.user,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      return { success: true, messageId: info.messageId as string | null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown email error';
      console.error('EmailService.send failed:', message);
      return { success: false, error: message };
    }
  }
}
