import nodemailer from 'nodemailer';

export async function sendVerificationEmail(to: string, verifyUrl: string) {
  // If no SMTP configured, just log the link for development
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env as Record<string, string | undefined>;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_FROM) {
    console.log(`[email] Verify ${to}: ${verifyUrl}`);
    return { ok: true, previewUrl: verifyUrl };
  }
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: false,
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
  const info = await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject: 'Verify your email',
    text: `Click to verify your email: ${verifyUrl}`,
    html: `<p>Click to verify your email:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
  });
  return { ok: true, messageId: info.messageId };
}

