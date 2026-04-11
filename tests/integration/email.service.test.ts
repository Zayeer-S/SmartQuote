import { describe, it, expect, beforeAll } from 'vitest';
import nodemailer, { type Transporter } from 'nodemailer';
import { EmailService } from '../../src/server/services/email/email.service';
import type {
  NotifyTicketReceivedData,
  NotifyQuoteGeneratedData,
  NotifyTicketResolvedData,
} from '../../src/server/services/notification/notification.service.types';

let transporter: Transporter;
let emailService: EmailService;

beforeAll(async () => {
  const account = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: {
      user: account.user,
      pass: account.pass,
    },
  });
  emailService = new EmailService(transporter);
});

const STUB_TICKET_RECEIVED: NotifyTicketReceivedData = {
  ticketId: 'ticket-integration-1',
  ticketTitle: 'Integration test ticket',
  ticketDescription: 'Verifying email dispatch end-to-end',
  ticketType: 'Support',
  severity: 'Medium',
  createdAt: new Date(),
  userId: 'user-integration-1',
  userEmail: 'recipient@example.com',
  userFirstName: 'Bob',
};

const STUB_QUOTE_GENERATED: NotifyQuoteGeneratedData = {
  quoteId: 'quote-integration-1',
  ticketId: 'ticket-integration-1',
  ticketTitle: 'Integration test ticket',
  estimatedHoursMin: 3,
  estimatedHoursMax: 6,
  estimatedCost: 450,
  suggestedPriority: 'P2',
  effortLevel: 'Medium',
  userId: 'user-integration-1',
  userEmail: 'recipient@example.com',
  userFirstName: 'Bob',
};

const STUB_TICKET_RESOLVED: NotifyTicketResolvedData = {
  ticketId: 'ticket-integration-1',
  ticketTitle: 'Integration test ticket',
  resolvedBy: 'agent-integration-1',
  resolvedAt: new Date(),
  userId: 'user-integration-1',
  userEmail: 'recipient@example.com',
  userFirstName: 'Bob',
};

describe('EmailService (Ethereal integration)', () => {
  describe('sendTicketReceived', () => {
    it('returns success with a messageId', async () => {
      const result = await emailService.sendTicketReceived(STUB_TICKET_RECEIVED);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeTruthy();
      expect(result.error).toBeUndefined();
    });

    it('does not return a skipped result', async () => {
      const result = await emailService.sendTicketReceived(STUB_TICKET_RECEIVED);

      expect(result.skipped).toBeUndefined();
    });
  });

  describe('sendQuoteGenerated', () => {
    it('returns success with a messageId', async () => {
      const result = await emailService.sendQuoteGenerated(STUB_QUOTE_GENERATED);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeTruthy();
      expect(result.error).toBeUndefined();
    });
  });

  describe('sendTicketResolved', () => {
    it('returns success with a messageId', async () => {
      const result = await emailService.sendTicketResolved(STUB_TICKET_RESOLVED);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeTruthy();
      expect(result.error).toBeUndefined();
    });
  });

  describe('transport failure', () => {
    it('returns failure result when transporter rejects', async () => {
      const brokenTransporter = nodemailer.createTransport({
        host: '127.0.0.1',
        port: 1, // nothing listening here
        secure: false,
        auth: { user: 'x', pass: 'x' },
        connectionTimeout: 500,
        greetingTimeout: 500,
        socketTimeout: 500,
      });
      const brokenService = new EmailService(brokenTransporter);

      const result = await brokenService.sendTicketReceived(STUB_TICKET_RECEIVED);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });
});
