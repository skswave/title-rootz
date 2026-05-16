/**
 * Email Module — Uses the existing email-service.mjs on the server.
 * Port of Origin's email.js adapted for Rootz Property Intelligence branding.
 * Falls back to console log if the email service isn't available.
 */

const SITE_URL = process.env.SITE_URL || 'https://title.rootz.global';
let emailService = null;

// Try to load the existing email service (Gmail OAuth2)
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
const __email_dirname = dirname(fileURLToPath(import.meta.url));
try {
  const servicePath = join(__email_dirname, 'lib', 'email-service.mjs');
  emailService = await import('file://' + servicePath.replace(/\\/g, '/'));
  console.log('  Email: using Gmail OAuth2 via email-service.mjs');
} catch (e) {
  console.log('  Email: email-service.mjs not available (' + e.message.substring(0, 60) + ') — using console log fallback');
}

export async function sendMagicLink(email, token, purpose = 'login') {
  const url = `${SITE_URL}/auth/verify?token=${token}`;

  const subject = purpose === 'invite'
    ? "You've been invited to Rootz Property Intelligence"
    : 'Sign in to Rootz Property Intelligence';

  if (emailService?.sendEmail) {
    try {
      await emailService.sendEmail({
        to: email,
        subject,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:500px;margin:0 auto;padding:30px">
            <h1 style="color:#1e3a5f;font-size:1.5em">Rootz Property Intelligence</h1>
            <p style="color:#334155;font-size:15px">${purpose === 'invite' ? "You've been invited to join Rootz Property Intelligence." : 'Click the link below to sign in to your farming dashboard.'}</p>
            <a href="${url}" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#1e3a5f 0%,#0f766e 100%);color:#fff;text-decoration:none;border-radius:8px;font-weight:600;margin:20px 0">${purpose === 'invite' ? 'Accept Invitation' : 'Sign In'}</a>
            <p style="color:#94a3b8;font-size:0.85em">This link expires in 15 minutes. If you didn't request this, you can ignore this email.</p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0">
            <p style="color:#94a3b8;font-size:0.8em">Rootz Property Intelligence Global — AI-powered real estate farming<br>title.rootz.global</p>
          </div>
        `,
      });
      console.log(`  Email: magic link sent to ${email} via sendEmail (${purpose})`);
      return { sent: true, method: 'gmail', url };
    } catch (e) {
      console.log(`  Email: sendEmail failed (${e.message}) — falling back to console`);
    }
  }

  // Final fallback: console log (dev mode)
  console.log('\n========================================');
  console.log(`  MAGIC LINK — ${purpose.toUpperCase()}`);
  console.log(`  To: ${email}`);
  console.log(`  Subject: ${subject}`);
  console.log(`  Link: ${url}`);
  console.log('========================================\n');

  return { sent: true, method: 'console', url };
}
