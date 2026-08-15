"""
Email service — SMTP integration with HTML templates.

Set SMTP_USER and SMTP_PASSWORD in .env to enable.
In development, OTPs are logged to console if credentials are empty.
"""

import asyncio
import os
import smtplib
import email.utils
from email.header import Header
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from loguru import logger
from app.core.config import settings

# ── Brand Logo URL ──────────────────────────────────────────────────────────
# Logo is served from the backend's /static/ endpoint.
# Email clients BLOCK data: URIs — a real http:// URL is required.
# In production: set API_URL to your deployed backend domain (e.g. https://api.yourapp.com)
# The logo file lives at: backend/app/static/logo.svg
def _logo_url() -> str:
    """Return the absolute URL to the logo hosted on the backend static server."""
    api_base = getattr(settings, "API_URL", None) or "http://localhost:8000"
    return f"{api_base}/static/logo.svg"


# ── HTML Email Templates ──────────────────────────────────────────────────────
def _base_html(content: str) -> str:
    """Wrap content in a clean, high-end SaaS email shell with robust inline styling."""
    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Data Insight</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    body, table, td, a {{ -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }}
    table, td {{ mso-table-lspace: 0pt; mso-table-rspace: 0pt; }}
    body {{ font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }}
  </style>
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F8FAFC;padding:48px 16px;">
    <tr>
      <td align="center">
        <!-- Card Container -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="max-width:560px;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px -5px rgba(15,23,42,0.08), 0 8px 10px -6px rgba(15,23,42,0.04);border:1px solid #E2E8F0;">

          <!-- Brand Header with High-End SaaS typography badge -->
          <tr>
            <td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid #F1F5F9;background:#FFFFFF;">
              <div style="display:inline-block;padding:8px 18px;background:#0F172A;border-radius:12px;">
                <span style="font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;font-size:17px;font-weight:800;letter-spacing:1px;color:#FFFFFF;">
                  DATA <span style="color:#10B981;">INSIGHT</span>
                </span>
              </div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:40px;">
              {content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background:#F8FAFC;border-top:1px solid #E2E8F0;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#64748B;letter-spacing:0.2px;">
                Data Insight · AI-Powered Business Intelligence
              </p>
              <p style="margin:0;font-size:12px;color:#94A3B8;line-height:1.5;">
                You received this email because an action was requested for your account.<br/>
                If you did not initiate this request, you can safely ignore this email.
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
    return _base_html(
        f"""
      <h2 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#0F172A;letter-spacing:-0.4px;">{greeting}</h2>
      <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.6;">{purpose}</p>

      <!-- OTP Box -->
      <div style="background:#F0FDF4;border:1.5px solid #86EFAC;border-radius:12px;
                  padding:28px 20px;text-align:center;margin-bottom:28px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:1.5px;">
          Verification Code
        </p>
        <p style="margin:0;font-family:'Inter',ui-monospace,Menlo,Consolas,monospace;font-size:42px;font-weight:800;color:#0F172A;letter-spacing:14px;padding-left:14px;">
          {otp}
        </p>
      </div>

      <p style="margin:0;font-size:13px;color:#64748B;text-align:center;line-height:1.5;">
        ⏱ This verification code will expire in <strong style="color:#0F172A;">{expiry}</strong>.<br/>
        For security, never share this code with anyone.
      </p>
    """
    )


# ── Public send functions ─────────────────────────────────────────────────────


async def send_email_verification(
    to_email: str, full_name: str | None, otp: str
) -> None:
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
    await _send(
        to=to_email,
        subject=f"Your Data Insight verification code: {otp}",
        html=html,
    )


async def send_password_reset(to_email: str, otp: str) -> None:
    """Send the 10-minute password reset OTP."""
    html = _otp_template(
        greeting="Reset your password 🔐",
        purpose=(
            "We received a request to reset your Data Insight password. "
            "Enter the code below to set a new password."
        ),
        otp=otp,
        expiry="10 minutes",
    )
    await _send(
        to=to_email,
        subject=f"Reset your Data Insight password: {otp}",
        html=html,
    )


async def send_welcome_email(to_email: str, full_name: str | None) -> None:
    """Send a welcome email after successful email verification."""
    name = full_name.split()[0] if full_name else "there"
    html = _base_html(
        f"""
      <h2 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#0F172A;letter-spacing:-0.4px;">
        You're in, {name}! 🎉
      </h2>
      <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.6;">
        Your Data Insight account is now active. Start by connecting your first
        data source and let the AI generate your first report in seconds.
      </p>
      <div style="text-align:center;margin-bottom:28px;">
        <a href="{settings.FRONTEND_URL}/dashboard"
           style="display:inline-block;background:#10B981;color:#ffffff;font-weight:600;
                  font-size:15px;padding:14px 36px;border-radius:10px;text-decoration:none;
                  box-shadow:0 4px 12px rgba(16,185,129,0.25);">
          Go to Dashboard →
        </a>
      </div>
      <p style="margin:0;font-size:13px;color:#94A3B8;text-align:center;line-height:1.5;">
        Questions? Reply to this email — we're always here to help.
      </p>
    """
    )
    await _send(to=to_email, subject=f"Welcome to Data Insight, {name}!", html=html)


async def send_team_invite(
    to_email: str, invited_by: str, org_name: str, invite_url: str
) -> None:
    """Send a team invitation email with an accept link."""
    html = _base_html(
        f"""
      <h2 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#0F172A;letter-spacing:-0.4px;">
        You've been invited to {org_name} 🤝
      </h2>
      <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.6;">
        <strong style="color:#0F172A;">{invited_by}</strong> has invited you to join the
        <strong style="color:#0F172A;">{org_name}</strong> workspace on Data Insight.
        Click the button below to set up your account and start collaborating.
      </p>

      <!-- Invite Box -->
      <div style="background:#F0FDF4;border:1.5px solid #86EFAC;border-radius:12px;
                  padding:24px 20px;text-align:center;margin-bottom:28px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:1.5px;">
          You're Invited To
        </p>
        <p style="margin:0;font-size:20px;font-weight:700;color:#0F172A;">
          {org_name}
        </p>
      </div>

      <div style="text-align:center;margin-bottom:28px;">
        <a href="{invite_url}"
           style="display:inline-block;background:#10B981;color:#ffffff;font-weight:600;
                  font-size:15px;padding:14px 36px;border-radius:10px;text-decoration:none;
                  box-shadow:0 4px 12px rgba(16,185,129,0.25);">
          Accept Invitation →
        </a>
      </div>
      <p style="margin:0;font-size:13px;color:#94A3B8;text-align:center;line-height:1.5;">
        ⏱ This invitation expires in <strong style="color:#475569;">7 days</strong>.<br/>
        If you didn't expect this invitation, you can safely ignore this email.
      </p>
    """
    )
    await _send(
        to=to_email, subject=f"You're invited to {org_name} on Data Insight", html=html
    )


async def send_report_ready(
    to_email: str, full_name: str | None, report_name: str, report_url: str
) -> None:
    """Send a notification when an AI report has finished generating."""
    name = full_name.split()[0] if full_name else "there"
    html = _base_html(
        f"""
      <h2 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#0F172A;letter-spacing:-0.4px;">
        Your report is ready, {name}! 📊
      </h2>
      <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.6;">
        The AI has finished analysing your data and your executive report
        <strong style="color:#0F172A;">"{report_name}"</strong> is now ready to view.
      </p>
      <div style="text-align:center;margin-bottom:28px;">
        <a href="{report_url}"
           style="display:inline-block;background:#10B981;color:#ffffff;font-weight:600;
                  font-size:15px;padding:14px 36px;border-radius:10px;text-decoration:none;
                  box-shadow:0 4px 12px rgba(16,185,129,0.25);">
          View Report →
        </a>
      </div>
    """
    )
    await _send(to=to_email, subject=f'Your report "{report_name}" is ready', html=html)


async def send_new_lead_notification(
    owner_email: str,
    lead_id: str,
    company_name: str,
    contact_person: str,
    business_email: str,
    company_size: str | None,
    industry: str | None,
    message: str | None,
    dashboard_url: str,
) -> None:
    """Notify the platform owner that a new demo/inquiry lead has arrived."""
    html = _base_html(
        f"""
      <h2 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#0F172A;letter-spacing:-0.4px;">
        🔔 New Demo Request — {company_name}
      </h2>
      <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
        A new company has submitted a request to access Data Insight.
        Review their details and move them through the pipeline.
      </p>

      <div style="background:#F0FDF4;border:1.5px solid #86EFAC;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:1.5px;">Lead ID</p>
        <p style="margin:0;font-size:20px;font-weight:800;color:#0F172A;font-family:monospace;">{lead_id}</p>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
        <tr><td style="padding:8px 0;border-bottom:1px solid #F1F5F9;font-size:13px;color:#64748B;font-weight:600;width:40%;">Company</td>
            <td style="padding:8px 0;border-bottom:1px solid #F1F5F9;font-size:13px;color:#0F172A;font-weight:700;">{company_name}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #F1F5F9;font-size:13px;color:#64748B;font-weight:600;">Contact</td>
            <td style="padding:8px 0;border-bottom:1px solid #F1F5F9;font-size:13px;color:#0F172A;font-weight:700;">{contact_person}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #F1F5F9;font-size:13px;color:#64748B;font-weight:600;">Email</td>
            <td style="padding:8px 0;border-bottom:1px solid #F1F5F9;font-size:13px;color:#10B981;font-weight:700;">{business_email}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #F1F5F9;font-size:13px;color:#64748B;font-weight:600;">Company Size</td>
            <td style="padding:8px 0;border-bottom:1px solid #F1F5F9;font-size:13px;color:#0F172A;font-weight:700;">{company_size or "—"}</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#64748B;font-weight:600;">Industry</td>
            <td style="padding:8px 0;font-size:13px;color:#0F172A;font-weight:700;">{industry or "—"}</td></tr>
      </table>

      {"<div style='background:#FFF7ED;border:1px solid #FED7AA;border-radius:10px;padding:16px;margin-bottom:24px;'><p style='margin:0 0 6px;font-size:11px;font-weight:700;color:#C2410C;text-transform:uppercase;letter-spacing:1px;'>Message</p><p style='margin:0;font-size:14px;color:#431407;line-height:1.6;'>" + (message or "No message provided") + "</p></div>" if True else ""}

      <div style="text-align:center;margin-bottom:24px;">
        <a href="{dashboard_url}"
           style="display:inline-block;background:#10B981;color:#ffffff;font-weight:700;
                  font-size:15px;padding:14px 36px;border-radius:10px;text-decoration:none;
                  box-shadow:0 4px 12px rgba(16,185,129,0.25);">
          Review in Dashboard →
        </a>
      </div>
      <p style="margin:0;font-size:12px;color:#94A3B8;text-align:center;line-height:1.5;">
        Go to Leads Pipeline in the Owner Dashboard to update the status and contact them.
      </p>
    """
    )
    await _send(
        to=owner_email,
        subject=f"🔔 New Demo Request: {company_name} [{lead_id}]",
        html=html,
    )


async def send_lead_inquiry_confirmation(
    to_email: str,
    contact_person: str,
    company_name: str,
    lead_id: str,
) -> None:
    """Send a professional acknowledgement to the person who submitted the inquiry."""
    name = contact_person.split()[0] if contact_person else "there"
    html = _base_html(
        f"""
      <h2 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#0F172A;letter-spacing:-0.4px;">
        Thank you, {name}! 🎉
      </h2>
      <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
        We've received your demo request for <strong style="color:#0F172A;">{company_name}</strong>.
        Our team will review your requirements and reach out within <strong style="color:#0F172A;">1 business day</strong>
        to schedule your personalised demo.
      </p>

      <div style="background:#F0FDF4;border:1.5px solid #86EFAC;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:1.5px;">Your Reference ID</p>
        <p style="margin:0;font-size:28px;font-weight:800;color:#0F172A;font-family:monospace;letter-spacing:4px;">{lead_id}</p>
        <p style="margin:8px 0 0;font-size:12px;color:#64748B;">Keep this ID for tracking your inquiry status.</p>
      </div>

      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:18px;margin-bottom:24px;">
        <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#0F172A;">What happens next?</p>
        <ol style="margin:0;padding-left:18px;font-size:13px;color:#475569;line-height:2;">
          <li>Our team reviews your requirements (within 24 hours)</li>
          <li>We contact you to schedule a personalised demo</li>
          <li>You review the platform with a dedicated Solutions Architect</li>
          <li>We prepare a tailored rental contract for your approval</li>
          <li>Your dedicated infrastructure is provisioned and handed over</li>
        </ol>
      </div>

      <p style="margin:0;font-size:13px;color:#64748B;text-align:center;line-height:1.5;">
        Questions? Reply to this email or contact us at
        <a href="mailto:sales@datainsight.ai" style="color:#10B981;font-weight:600;">sales@datainsight.ai</a>
      </p>
    """
    )
    await _send(
        to=to_email,
        subject=f"✅ Demo Request Received — {company_name} [{lead_id}]",
        html=html,
    )


# ── Internal send ─────────────────────────────────────────────────────────────



def _sync_send(to: str, subject: str, html: str) -> None:
    """Synchronous function to send multi-part (plain text + HTML) email via smtplib with RFC 5322 compliance."""
    import re
    plain_text = re.sub(r"<[^>]+>", "", html).strip()

    msg = MIMEMultipart("alternative")
    msg["Subject"] = Header(subject, "utf-8")
    msg["From"] = email.utils.formataddr(("Data Insight", settings.EMAIL_FROM))
    msg["To"] = to
    msg["Date"] = email.utils.formatdate(localtime=True)
    msg["Message-ID"] = email.utils.make_msgid(domain="gmail.com")

    # Attach both plain text and HTML versions for spam filter compliance
    msg.attach(MIMEText(plain_text, "plain", "utf-8"))
    msg.attach(MIMEText(html, "html", "utf-8"))

    server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)
    server.starttls()
    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
    server.sendmail(settings.EMAIL_FROM, [to], msg.as_string())
    server.quit()


async def _send(to: str, subject: str, html: str) -> None:
    """
    Send via SMTP in a thread pool to avoid blocking the event loop.
    Falls back to console log if SMTP_USER is not set.
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        # Dev mode — print OTP or URLs to console so developers can see it
        import re
        urls = re.findall(r'href=[\'"]?([^\'" >]+)', html)
        urls_str = "\n".join([f"Link:    {url}" for url in urls])
        
        logger.warning(
            f"\n{'='*60}\n"
            f"DEV EMAIL (no SMTP credentials set)\n"
            f"To:      {to}\n"
            f"Subject: {subject}\n"
            f"{urls_str}\n"
            f"[HTML content omitted]\n"
            f"{'='*60}"
        )
        return

    try:
        await asyncio.to_thread(_sync_send, to, subject, html)
        logger.info(f"[Email] Sent to {to} via SMTP | subject='{subject}'")
    except Exception as exc:
        logger.error(
            f"[Email] Failed to send to {to} | subject='{subject}' | error: {exc}"
        )
        # Don't re-raise — email failure should not crash the auth flow.
