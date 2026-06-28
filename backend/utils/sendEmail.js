import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const defaultFrom = process.env.MAIL_FROM || 'UniPulse <no-reply@unipulse.live>';

/**
 * Generic email sender used across the app.
 * @param {Object} opts
 * @param {string} opts.to      - recipient address
 * @param {string} opts.subject - subject line
 * @param {string} opts.html    - HTML body
 * @param {string} [opts.text]  - optional plaintext fallback
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  if (!resend) {
    throw new Error('RESEND_API_KEY is not configured.');
  }

  const { error } = await resend.emails.send({
    from: defaultFrom,
    to,
    subject,
    html,
    ...(text ? { text } : {}),
  });

  if (error) {
    console.error('Resend Error:', error);
    throw new Error(error.message || 'Failed to send email.');
  }
};

/**
 * Convenience wrapper that formats and sends a verification code email.
 * Keeping the template here keeps the auth controller clean.
 */
export const sendOtpEmail = async (to, code) => {
  if (!process.env.RESEND_API_KEY) {
    console.log('\n==================== DEV OTP ====================');
    console.log(`  Code for ${to}:  ${code}`);
    console.log('  (Set RESEND_API_KEY in .env to email codes for real.)');
    console.log('================================================\n');
    return;
  }

  const subject = 'Verify your UniPulse account';
  const text = `Your verification code is ${code}. It expires in ${
    process.env.OTP_TTL_MINUTES || 10
  } minutes.`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color:#1d4ed8;">Welcome to UniPulse</h2>
      <p>Your verification code is: <strong>${code}</strong></p>
      <p style="color:#64748b; font-size: 13px; margin-top:16px;">
        This code expires in ${process.env.OTP_TTL_MINUTES || 10} minutes.
        If you did not request it, you can safely ignore this email.
      </p>
    </div>
  `;

  await sendEmail({ to, subject, html, text });
};
