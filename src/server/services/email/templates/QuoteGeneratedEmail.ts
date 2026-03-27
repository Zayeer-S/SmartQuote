import { emailLayout } from './EmailLayout.js';
import type { NotifyQuoteGeneratedData } from '../../notification/notification.types.js';

export function quoteGeneratedEmail(data: NotifyQuoteGeneratedData): string {
  const formattedCost = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(data.estimatedCost);

  const content = `
    <p style="font-size:18px;font-weight:bold;color:#1a1a2e;margin:0 0 12px;">Hi ${data.userFirstName},</p>
    <p style="font-size:14px;color:#374151;line-height:22px;margin:0 0 16px;">
      A quote has been generated for your ticket. Please log in to review it and accept or reject the quote.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:6px;padding:16px;margin:0 0 20px;">
      <tr>
        <td>
          <p style="font-size:13px;font-weight:bold;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 12px;">Quote Summary</p>
          ${detailRow('Ticket ID', data.ticketId)}
          ${detailRow('Ticket', data.ticketTitle)}
          ${detailRow('Estimated Hours', `${String(data.estimatedHoursMin)} - ${String(data.estimatedHoursMax)} hrs`)}
          ${detailRow('Estimated Cost', formattedCost)}
          ${detailRow('Suggested Priority', data.suggestedPriority)}
          ${detailRow('Effort Level', data.effortLevel)}
        </td>
      </tr>
    </table>

    <p style="font-size:14px;color:#374151;line-height:22px;margin:0 0 12px;">
      Please log in to your SmartQuote dashboard to review the full quote details and take action.
    </p>
    <p style="font-size:12px;color:#9ca3af;font-style:italic;margin:0;">
      This quote is subject to review and may be adjusted before final approval.
    </p>
  `;

  return emailLayout({
    previewText: `A quote has been generated for your ticket "${data.ticketTitle}"`,
    content,
  });
}

function detailRow(label: string, value: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:6px;">
      <tr>
        <td width="140" style="font-size:13px;color:#6b7280;font-weight:500;vertical-align:top;">${label}</td>
        <td style="font-size:13px;color:#111827;vertical-align:top;">${value}</td>
      </tr>
    </table>
  `;
}
