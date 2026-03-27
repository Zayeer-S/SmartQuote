export interface EmailLayoutOptions {
  previewText: string;
  content: string;
}

export function emailLayout({ previewText, content }: EmailLayoutOptions): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0;padding:0;background-color:#f6f9fc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Ubuntu,sans-serif;">
    <span style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;">${previewText}</span>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f9fc;padding:40px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;margin-bottom:64px;">
            <!-- Header -->
            <tr>
              <td style="background-color:#1a1a2e;padding:24px;text-align:center;">
                <span style="color:#ffffff;font-size:24px;font-weight:bold;">SmartQuote</span>
              </td>
            </tr>
            <!-- Content -->
            <tr>
              <td style="padding:24px;">
                ${content}
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding:0 24px 24px;">
                <hr style="border-color:#e6ebf1;margin:20px 0;" />
                <p style="color:#8898aa;font-size:12px;line-height:16px;margin:4px 0;">
                  This is an automated message from SmartQuote. Please do not reply to this email.
                </p>
                <p style="color:#8898aa;font-size:12px;line-height:16px;margin:4px 0;">
                  Need help? Contact us at <a href="mailto:support@smartquote.com" style="color:#556cd6;text-decoration:underline;">support@smartquote.com</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();
}
