import nodemailer from 'nodemailer';
import { Resend } from 'resend';

export async function sendVerificationEmail(to: string, verifyUrl: string) {
  const env = process.env as Record<string, string | undefined>;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, RESEND_API_KEY, EMAIL_FROM } = env;
  const from = (RESEND_API_KEY ? (EMAIL_FROM || 'onboarding@resend.dev') : (EMAIL_FROM || SMTP_FROM || 'Tasaweers <no-reply@example.com>'));

  // Prefer Resend if configured
  if (RESEND_API_KEY) {
    const resend = new Resend(RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: 'Verify your email',
      text: `Click to verify your email: ${verifyUrl}`,
      html: `<p>Click to verify your email:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
    });
    if (error) throw error;
    return { ok: true, messageId: data?.id };
  }

  // Fallback to SMTP if available
  if (SMTP_HOST && SMTP_PORT && from) {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 587),
      secure: false,
      auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    });
    const info = await transporter.sendMail({
      from,
      to,
      subject: 'Verify your email',
      text: `Click to verify your email: ${verifyUrl}`,
      html: `<p>Click to verify your email:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
    });
    return { ok: true, messageId: info.messageId };
  }

  // Dev fallback: log
  console.log(`[email] Verify ${to}: ${verifyUrl}`);
  return { ok: true, previewUrl: verifyUrl };
}

export async function sendVerificationCodeEmail(to: string, code: string) {
  const env = process.env as Record<string, string | undefined>;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, RESEND_API_KEY, EMAIL_FROM } = env;
  const from = (RESEND_API_KEY ? (EMAIL_FROM || 'onboarding@resend.dev') : (EMAIL_FROM || SMTP_FROM || 'Tasaweers <no-reply@example.com>'));
  const subject = 'Your verification code';
  const text = `Your verification code is: ${code}\n\nThis code expires in 15 minutes.`;
  const html = `<p>Your verification code is:</p><p style="font-size:24px;font-weight:700;letter-spacing:6px;">${code}</p><p>This code expires in 15 minutes.</p>`;

  // Prefer Resend if configured
  if (RESEND_API_KEY) {
    const resend = new Resend(RESEND_API_KEY);
    const { data, error } = await resend.emails.send({ from, to, subject, text, html });
    if (error) throw error;
    return { ok: true, messageId: data?.id };
  }

  // Fallback to SMTP if available
  if (SMTP_HOST && SMTP_PORT && from) {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 587),
      secure: false,
      auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    });
    const info = await transporter.sendMail({ from, to, subject, text, html });
    return { ok: true, messageId: info.messageId };
  }

  // Dev fallback: log code
  console.log(`[email] Verify code for ${to}: ${code}`);
  return { ok: true, previewCode: code };
}
