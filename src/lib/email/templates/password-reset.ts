function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function buildPasswordResetEmail({
  name,
  resetUrl,
  expiresMinutes = 30,
}: {
  name: string;
  resetUrl: string;
  expiresMinutes?: number;
}): { subject: string; html: string; text: string } {
  const safeName = escapeHtml(name || "Administrator");
  const safeUrl = escapeHtml(resetUrl);

  const subject = "Reset Your Vistara Admin Password";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#F7F8F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1B1F1C;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid rgba(1,50,32,0.12);">
          <tr>
            <td style="background-color:#013220;padding:28px 32px;text-align:left;">
              <p style="margin:0;font-size:20px;font-weight:700;letter-spacing:-0.01em;color:#FFFFFF;">
                Vistara Cleaning Services
              </p>
              <p style="margin:4px 0 0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#E8F0E8;">
                Admin Portal Security
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#013220;">
                Password Reset Request
              </h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#1B1F1C;">
                Hello ${safeName},
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#1B1F1C;">
                We received a request to reset your password for the Vistara Admin Portal. Click the button below to choose a new password. This link expires in <strong>${expiresMinutes} minutes</strong> and can only be used once.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
                <tr>
                  <td style="border-radius:9999px;background-color:#014421;">
                    <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:9999px;">
                      Reset Admin Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 12px;font-size:13px;line-height:1.5;color:#355E3B;">
                If the button does not work, copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 24px;word-break:break-all;font-size:12px;line-height:1.5;color:#014421;background-color:#F7F8F4;padding:12px;border-radius:10px;border:1px solid rgba(1,50,32,0.1);">
                ${safeUrl}
              </p>
              <hr style="border:none;border-top:1px solid rgba(1,50,32,0.1);margin:24px 0;" />
              <p style="margin:0;font-size:12px;line-height:1.6;color:#355E3B;">
                <strong>Security notice:</strong> If you did not request a password reset, you can safely ignore this email—your existing password remains unchanged. Never share this link with anyone.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    `Hello ${name || "Administrator"},`,
    "",
    "We received a request to reset your password for the Vistara Admin Portal.",
    `This link expires in ${expiresMinutes} minutes and can only be used once:`,
    resetUrl,
    "",
    "If you did not request this, you can safely ignore this email.",
  ].join("\n");

  return { subject, html, text };
}
