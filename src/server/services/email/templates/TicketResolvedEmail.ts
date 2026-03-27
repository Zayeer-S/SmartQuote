import { emailLayout } from './EmailLayout.js';
import type { NotifyTicketResolvedData } from '../../notification/notification.service.types.js';

export function ticketResolvedEmail(data: NotifyTicketResolvedData): string {
  const content = `
    <p style="font-size:18px;font-weight:bold;color:#1a1a2e;margin:0 0 12px;">Hi ${data.userFirstName},</p>
    <p style="font-size:14px;color:#374151;line-height:22px;margin:0 0 16px;">
      Your support ticket has been resolved. We hope your issue has been addressed to your satisfaction.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:6px;padding:16px;margin:0 0 20px;">
      <tr>
        <td>
          <p style="font-size:13px;font-weight:bold;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 12px;">Resolution Details</p>
          ${detailRow('Ticket ID', data.ticketId)}
          ${detailRow('Title', data.ticketTitle)}
          ${detailRow('Resolved By', data.resolvedBy)}
          ${detailRow('Resolved At', data.resolvedAt.toLocaleString())}
          ${data.resolutionComment ? detailRow('Comment', data.resolutionComment) : ''}
        </td>
      </tr>
    </table>

    <p style="font-size:14px;color:#374151;line-height:22px;margin:0;">
      If you believe your issue has not been fully resolved, please submit a new ticket and reference this ticket ID.
    </p>
  `;

  return emailLayout({
    previewText: `Your ticket "${data.ticketTitle}" has been resolved`,
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
