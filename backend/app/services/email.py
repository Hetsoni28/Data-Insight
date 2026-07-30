"""
Email service — SMTP integration with HTML templates.

Set SMTP_USER and SMTP_PASSWORD in .env to enable.
In development, OTPs are logged to console if credentials are empty.
"""
import asyncio
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from loguru import logger
from app.core.config import settings


# ── HTML Email Templates ──────────────────────────────────────────────────────
def _base_html(content: str) -> str:
    """Wrap content in a clean, minimal email shell."""
    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Data Insight</title>
  <!-- Import Inter font for modern typography in supported clients -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Inter',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);border:1px solid #e5e7eb;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px;text-align:center;border-bottom:1px solid #f3f4f6;">
              <span style="font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                <span style="color:#10B981;margin-right:4px;">◆</span>
                <span style="color:#10B981;font-weight:700;">Data</span><span style="color:#334155;font-weight:400;">Insight</span>
              </span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              {content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                Data Insight · AI-Powered Business Intelligence<br/>
                You received this email because an account action was performed.<br/>
                If you didn't do this, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


def _otp_template(greeting: str, purpose: str, otp: str, expiry: str) -> str:
    return _base_html(f"""
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">{greeting}</h2>
      <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">{purpose}</p>

      <!-- OTP Box -->
      <div style="background:#f0fdf4;border:2px solid #10B981;border-radius:10px;
                  padding:24px;text-align:center;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#10B981;text-transform:uppercase;letter-spacing:1px;">
          Your code
        </p>
        <p style="margin:0;font-size:40px;font-weight:700;color:#111827;letter-spacing:12px;">
          {otp}
        </p>
      </div>

      <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;">
        ⏱ This code expires in <strong>{expiry}</strong>. Do not share it with anyone.
      </p>
    """)


# ── Public send functions ─────────────────────────────────────────────────────

async def send_email_verification(to_email: str, full_name: str | None, otp: str) -> None:
    """Send the 5-minute email verification OTP."""
    name = full_name.split()[0] if full_name else "there"
    html = _otp_template(
        greeting=f"Welcome, {name}! 👋",
        purpose=(
            "Thanks for creating your Data Insight account. "
            "Enter the code below to verify your email address and activate your account."
        ),
        otp=otp,
        expiry="5 minutes",
    )
    await _send(to=to_email, subject="Your Data Insight verification code", html=html)


async def send_password_reset(to_email: str, otp: str) -> None:
    """Send the 10-minute password reset OTP."""
    html = _otp_template(
        greeting="Reset your password",
        purpose=(
            "We received a request to reset your Data Insight password. "
            "Enter the code below to set a new password."
        ),
        otp=otp,
        expiry="10 minutes",
    )
    await _send(to=to_email, subject="Reset your Data Insight password", html=html)


async def send_welcome_email(to_email: str, full_name: str | None) -> None:
    """Send a welcome email after successful email verification."""
    name = full_name.split()[0] if full_name else "there"
    html = _base_html(f"""
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">
        You're in, {name}! 🎉
      </h2>
      <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
        Your Data Insight account is now active. Start by connecting your first
        data source and let the AI generate your first report in seconds.
      </p>
      <div style="text-align:center;margin-bottom:24px;">
        <a href="{settings.FRONTEND_URL}/dashboard"
           style="display:inline-block;background:#10B981;color:#ffffff;font-weight:600;
                  font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;">
          Go to Dashboard →
        </a>
      </div>
      <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;">
        Questions? Reply to this email — we're here to help.
      </p>
    """)
    await _send(to=to_email, subject=f"Welcome to Data Insight, {name}!", html=html)


async def send_team_invite(to_email: str, invited_by: str, org_name: str, invite_url: str) -> None:
    """Send a team invitation email with an accept link."""
    html = _base_html(f"""
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">
        You've been invited to {org_name}
      </h2>
      <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
        <strong>{invited_by}</strong> has invited you to join their Data Insight
        workspace. Click the button below to accept the invitation.
      </p>
      <div style="text-align:center;margin-bottom:24px;">
        <a href="{invite_url}"
           style="display:inline-block;background:#10B981;color:#ffffff;font-weight:600;
                  font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;">
          Accept Invitation →
        </a>
      </div>
      <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;">
        This invitation expires in 7 days.
      </p>
    """)
    await _send(to=to_email, subject=f"You're invited to {org_name} on Data Insight", html=html)


async def send_report_ready(to_email: str, full_name: str | None, report_name: str, report_url: str) -> None:
    """Send a notification when an AI report has finished generating."""
    name = full_name.split()[0] if full_name else "there"
    html = _base_html(f"""
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">
        Your report is ready, {name}! 📊
      </h2>
      <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
        The AI has finished analysing your data and your report
        <strong>"{report_name}"</strong> is now ready to view.
      </p>
      <div style="text-align:center;margin-bottom:24px;">
        <a href="{report_url}"
           style="display:inline-block;background:#10B981;color:#ffffff;font-weight:600;
                  font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;">
          View Report →
        </a>
      </div>
    """)
    await _send(to=to_email, subject=f'Your report "{report_name}" is ready', html=html)


# ── Internal send ─────────────────────────────────────────────────────────────

def _sync_send(to: str, subject: str, html: str) -> None:
    """Synchronous function to actually send the email via smtplib."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to

    msg.attach(MIMEText(html, "html"))

    server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
    server.starttls()
    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
    server.sendmail(settings.EMAIL_FROM, to, msg.as_string())
    server.quit()


async def _send(to: str, subject: str, html: str) -> None:
    """
    Send via SMTP in a thread pool to avoid blocking the event loop.
    Falls back to console log if SMTP_USER is not set.
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        # Dev mode — print OTP to console so developers can see it
        logger.warning(
            f"\n{'='*60}\n"
            f"DEV EMAIL (no SMTP credentials set)\n"
            f"To:      {to}\n"
            f"Subject: {subject}\n"
            f"[HTML content omitted]\n"
            f"{'='*60}"
        )
        return

    try:
        await asyncio.to_thread(_sync_send, to, subject, html)
        logger.info(f"[Email] Sent to {to} via SMTP | subject='{subject}'")
    except Exception as exc:
        logger.error(f"[Email] Failed to send to {to} | subject='{subject}' | error: {exc}")
        # Don't re-raise — email failure should not crash the auth flow.
