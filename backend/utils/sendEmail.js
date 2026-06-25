import nodemailer from 'nodemailer';

/**
 * A lazily-created, reused Nodemailer transport. We build it once and cache it
 * so we are not opening a new SMTP connection on every email.
 */
let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    // secure:true for port 465, false for 587 (STARTTLS).
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  return transporter;
};

/**
 * Generic email sender used across the app.
 * @param {Object} opts
 * @param {string} opts.to      - recipient address
 * @param {string} opts.subject - subject line
 * @param {string} opts.html    - HTML body
 * @param {string} [opts.text]  - optional plaintext fallback
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  await getTransporter().sendMail({ from, to, subject, html, text });
};

/**
 * Convenience wrapper that formats and sends a verification code email.
 * Keeping the template here keeps the auth controller clean.
 */
export const sendOtpEmail = async (to, code) => {
  const subject = 'Your UniPulse verification code';
  const text = `Your UniPulse verification code is ${code}. It expires in ${
    process.env.OTP_TTL_MINUTES || 10
  } minutes.`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color:#1d4ed8;">Welcome to UniPulse</h2>
      <p>Use the code below to verify your UBC student email:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px;
                  background:#f1f5f9; padding:16px; text-align:center; border-radius:8px;">
        ${code}
      </div>
      <p style="color:#64748b; font-size: 13px; margin-top:16px;">
        This code expires in ${process.env.OTP_TTL_MINUTES || 10} minutes.
        If you did not request it, you can safely ignore this email.
      </p>
    </div>
  `;

  await sendEmail({ to, subject, html, text });
};
