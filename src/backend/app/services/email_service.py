import uuid
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy import insert, select
from app.core.config import settings
from app.db.session import engine
from app.db.models.email_log import email_logs_table

logger = logging.getLogger("email_service")

class EmailService:
    @staticmethod
    def _create_html_wrapper(title: str, preheader: str, content_html: str) -> str:
        return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<style>
  body {{ margin: 0; padding: 0; background-color: #080C16; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F8FAFC; }}
  .container {{ max-width: 600px; margin: 30px auto; background-color: #0F172A; border-radius: 16px; border: 1px solid #1E293B; overflow: hidden; }}
  .header {{ background: linear-gradient(135deg, #1E1B4B 0%, #0F172A 50%, #064E3B 100%); padding: 32px 28px; border-bottom: 1px solid #1E293B; }}
  .brand {{ font-size: 20px; font-weight: 900; letter-spacing: -0.5px; color: #FFFFFF; text-transform: uppercase; }}
  .brand span {{ color: #10B981; }}
  .body {{ padding: 32px 28px; line-height: 1.6; font-size: 14px; color: #E2E8F0; }}
  .highlight-card {{ background-color: #080C16; border: 1px solid #1E293B; border-radius: 12px; padding: 20px; margin: 20px 0; }}
  .btn {{ display: inline-block; background-color: #10B981; color: #FFFFFF; font-weight: 700; font-size: 13px; text-decoration: none; padding: 12px 24px; border-radius: 10px; margin: 16px 0; text-align: center; }}
  .footer {{ padding: 20px 28px; border-top: 1px solid #1E293B; font-size: 11px; color: #64748B; text-align: center; background-color: #080C16; }}
</style>
</head>
<body>
<div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
  {preheader}
</div>
<div class="container">
  <div class="header">
    <div class="brand">DOGFOOD <span>HACKATHONS</span></div>
    <div style="font-size: 11px; color: #94A3B8; font-family: monospace; margin-top: 4px;">AUTOMATED PLATFORM NOTIFICATIONS</div>
  </div>
  <div class="body">
    {content_html}
  </div>
  <div class="footer">
    Sent by DOGFOOD Hackathon Platform · Autonomous Verification & Score Calibration Engine<br>
    © 2026 DOGFOOD Foundation. All rights reserved.
  </div>
</div>
</body>
</html>"""

    @staticmethod
    def send_email(
        to_email: str,
        subject: str,
        html_content: str,
        text_content: str,
        template: str = "generic",
    ) -> Dict[str, Any]:
        log_id = f"eml_{uuid.uuid4().hex[:10]}"
        status_val = "simulated"
        error_msg = None

        if settings.EMAIL_ENABLED and settings.SMTP_HOST and settings.SMTP_USER:
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
                msg["To"] = to_email

                part1 = MIMEText(text_content, "plain")
                part2 = MIMEText(html_content, "html")
                msg.attach(part1)
                msg.attach(part2)

                with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                    if settings.SMTP_USE_TLS:
                        server.starttls()
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                    server.sendmail(settings.SMTP_FROM_EMAIL, [to_email], msg.as_string())
                status_val = "sent"
                logger.info(f"Email sent via SMTP to {to_email} (Subject: {subject})")
            except Exception as e:
                status_val = "failed"
                error_msg = str(e)
                logger.error(f"Failed to send email via SMTP to {to_email}: {e}")
        else:
            # Simulated email dispatch (clean developer experience when SMTP credentials are not configured)
            logger.info(
                f"[EMAIL SIMULATED DISPATCH] To: {to_email} | Subject: '{subject}' | Template: {template}"
            )

        # Audit email log into database
        try:
            with engine.begin() as conn:
                stmt = insert(email_logs_table).values(
                    id=log_id,
                    recipient=to_email,
                    subject=subject,
                    template=template,
                    status=status_val,
                    body_preview=text_content[:250],
                    error_message=error_msg,
                )
                conn.execute(stmt)
        except Exception as log_err:
            logger.warning(f"Failed to record email log in database: {log_err}")

        return {
            "id": log_id,
            "recipient": to_email,
            "subject": subject,
            "template": template,
            "status": status_val,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    @staticmethod
    def send_registration_email(user_email: str, user_name: Optional[str], event_data: Dict[str, Any]):
        name = user_name or user_email.split("@")[0].capitalize()
        event_name = event_data.get("title") or event_data.get("name") or "Hackathon"
        slug = event_data.get("slug") or event_data.get("id") or ""
        prizes = event_data.get("prize_display") or "$25,000"
        deadline = event_data.get("deadline_display") or "Closing soon"

        html_body = f"""
        <h2 style="color: #FFFFFF; font-size: 20px; font-weight: 800; margin-top: 0;">You're in, {name}! 🚀</h2>
        <p>Your registration for <strong style="color: #10B981;">{event_name}</strong> is confirmed.</p>
        
        <div class="highlight-card">
          <div style="font-size: 11px; text-transform: uppercase; color: #94A3B8; font-weight: 700;">Hackathon Summary</div>
          <div style="font-size: 16px; font-weight: 800; color: #FFFFFF; margin: 4px 0;">{event_name}</div>
          <div style="font-size: 12px; color: #CBD5E1; margin-top: 4px;">🏆 Prize Pool: <strong style="color: #34D399;">{prizes}</strong></div>
          <div style="font-size: 12px; color: #CBD5E1;">⏰ Deadline: {deadline}</div>
        </div>

        <p>What's next?</p>
        <ul style="padding-left: 20px; color: #CBD5E1;">
          <li>Form or invite teammates to join your squad</li>
          <li>Select from the available competition tracks</li>
          <li>Submit your code repository & demo before the deadline</li>
        </ul>

        <div style="text-align: center; margin: 24px 0;">
          <a href="http://localhost:8080/dashboard/hackathon/{slug}?tab=overview" class="btn">Go to Hackathon Workspace →</a>
        </div>
        """

        text_body = f"Hello {name},\n\nYour registration for '{event_name}' is confirmed!\nPrize Pool: {prizes}\nDeadline: {deadline}\n\nWorkspace URL: http://localhost:8080/dashboard/hackathon/{slug}\n\nHappy Hacking!\nDOGFOOD Team"

        return EmailService.send_email(
            to_email=user_email,
            subject=f"Registration Confirmed: {event_name} 🚀",
            html_content=EmailService._create_html_wrapper(
                f"Registration Confirmed - {event_name}",
                f"You are registered for {event_name}!",
                html_body,
            ),
            text_content=text_body,
            template="event_registration",
        )

    @staticmethod
    def send_unregistration_email(user_email: str, user_name: Optional[str], event_data: Dict[str, Any]):
        name = user_name or user_email.split("@")[0].capitalize()
        event_name = event_data.get("title") or event_data.get("name") or "Hackathon"

        html_body = f"""
        <h2 style="color: #FFFFFF; font-size: 20px; font-weight: 800; margin-top: 0;">Registration Cancelled</h2>
        <p>Hi {name},</p>
        <p>You have successfully unregistered from <strong style="color: #F87171;">{event_name}</strong>. Your spot and team associations for this event have been released.</p>
        <p>If this was a mistake, you can re-register anytime before the deadline on the hackathons portal.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="http://localhost:8080/hackathons" class="btn">Browse Other Hackathons →</a>
        </div>
        """
        text_body = f"Hi {name},\n\nYou have unregistered from '{event_name}'. You can re-register anytime before the deadline at http://localhost:8080/hackathons."

        return EmailService.send_email(
            to_email=user_email,
            subject=f"Registration Cancelled: {event_name}",
            html_content=EmailService._create_html_wrapper(
                f"Registration Cancelled - {event_name}",
                f"You have unregistered from {event_name}",
                html_body,
            ),
            text_content=text_body,
            template="event_unregistration",
        )

    @staticmethod
    def send_submission_email(
        user_email: str,
        user_name: Optional[str],
        project_data: Dict[str, Any],
        event_data: Dict[str, Any],
    ):
        name = user_name or user_email.split("@")[0].capitalize()
        proj_title = project_data.get("title", "Hackathon Project")
        event_name = event_data.get("title") or event_data.get("name") or "Hackathon"
        slug = event_data.get("slug") or event_data.get("id") or ""
        track = project_data.get("track_label") or project_data.get("track", "General Track")
        repo = project_data.get("repo_url", "")
        demo = project_data.get("demo_url", "")

        html_body = f"""
        <h2 style="color: #FFFFFF; font-size: 20px; font-weight: 800; margin-top: 0;">Submission Received! 🎯</h2>
        <p>Congratulations {name}, your project <strong style="color: #10B981;">{proj_title}</strong> has been successfully recorded for <strong style="color: #FFFFFF;">{event_name}</strong>.</p>
        
        <div class="highlight-card">
          <div style="font-size: 11px; text-transform: uppercase; color: #94A3B8; font-weight: 700;">Submission Details</div>
          <div style="font-size: 16px; font-weight: 800; color: #FFFFFF; margin: 4px 0;">{proj_title}</div>
          <div style="font-size: 12px; color: #CBD5E1;">🎯 Track: <strong>{track}</strong></div>
          {f'<div style="font-size: 12px; color: #CBD5E1;">📂 Repo: <a href="{repo}" style="color: #38BDF8;">{repo}</a></div>' if repo else ''}
          {f'<div style="font-size: 12px; color: #CBD5E1;">🌐 Demo: <a href="{demo}" style="color: #38BDF8;">{demo}</a></div>' if demo else ''}
        </div>

        <p style="font-size: 12px; color: #94A3B8;">
          You can update your submission details and code links anytime before the official deadline. Once submissions close, assigned evaluators will begin isolated blind reviews.
        </p>

        <div style="text-align: center; margin: 24px 0;">
          <a href="http://localhost:8080/dashboard/hackathon/{slug}?tab=submissions" class="btn">View / Edit Submission →</a>
        </div>
        """

        text_body = f"Hi {name},\n\nYour project '{proj_title}' was successfully submitted to '{event_name}' in track '{track}'.\n\nYou can review or edit your submission at: http://localhost:8080/dashboard/hackathon/{slug}?tab=submissions\n\nBest of luck!\nDOGFOOD Team"

        return EmailService.send_email(
            to_email=user_email,
            subject=f"Submission Received: {proj_title} ({event_name}) 🎯",
            html_content=EmailService._create_html_wrapper(
                f"Submission Received - {proj_title}",
                f"Your submission for {event_name} is in!",
                html_body,
            ),
            text_content=text_body,
            template="project_submission",
        )

    @staticmethod
    def send_team_invite_email(
        invitee_email: str,
        inviter_name: str,
        team_name: str,
        event_data: Dict[str, Any],
        invite_url: str,
    ):
        event_name = event_data.get("title") or event_data.get("name") or "Hackathon"

        html_body = f"""
        <h2 style="color: #FFFFFF; font-size: 20px; font-weight: 800; margin-top: 0;">You're Invited to Join a Squad! 🤝</h2>
        <p><strong style="color: #10B981;">{inviter_name}</strong> has invited you to join team <strong style="color: #FFFFFF;">'{team_name}'</strong> for <strong>{event_name}</strong>.</p>
        
        <div class="highlight-card">
          <div style="font-size: 11px; text-transform: uppercase; color: #94A3B8; font-weight: 700;">Invitation Details</div>
          <div style="font-size: 15px; font-weight: 800; color: #FFFFFF; margin: 4px 0;">Team: {team_name}</div>
          <div style="font-size: 12px; color: #CBD5E1;">Event: {event_name}</div>
          <div style="font-size: 12px; color: #CBD5E1;">Invited by: {inviter_name}</div>
        </div>

        <p>Accept the invitation to collaborate, coordinate code contributions, and build together.</p>

        <div style="text-align: center; margin: 24px 0;">
          <a href="{invite_url}" class="btn">Accept Invitation & Join Team →</a>
        </div>
        """

        text_body = f"Hi,\n\n{inviter_name} has invited you to join team '{team_name}' for {event_name}.\n\nAccept your invitation here:\n{invite_url}\n\nDOGFOOD Team"

        return EmailService.send_email(
            to_email=invitee_email,
            subject=f"Team Invite: Join '{team_name}' for {event_name} 🤝",
            html_content=EmailService._create_html_wrapper(
                f"Team Invite - {event_name}",
                f"{inviter_name} invited you to join team {team_name}",
                html_body,
            ),
            text_content=text_body,
            template="team_invite",
        )

    @staticmethod
    def send_new_hackathon_announcement(recipients: List[str], event_data: Dict[str, Any]):
        event_name = event_data.get("title") or event_data.get("name") or "New Hackathon"
        slug = event_data.get("slug") or event_data.get("id") or ""
        tagline = event_data.get("tagline", "Compete with global developers.")
        prizes = event_data.get("prize_display") or "$50,000"

        html_body = f"""
        <h2 style="color: #FFFFFF; font-size: 20px; font-weight: 800; margin-top: 0;">New Hackathon Announced! ⚡</h2>
        <p>A brand new competition has just launched on the DOGFOOD platform: <strong style="color: #10B981;">{event_name}</strong>.</p>
        
        <div class="highlight-card">
          <div style="font-size: 16px; font-weight: 800; color: #FFFFFF; margin-bottom: 6px;">{event_name}</div>
          <p style="font-size: 12px; color: #CBD5E1; margin: 0 0 10px 0;">{tagline}</p>
          <div style="font-size: 13px; color: #34D399; font-weight: 700;">🏆 Total Prizes: {prizes}</div>
        </div>

        <p>Registration is now open. Jump in early to secure your spot and start forming your team.</p>

        <div style="text-align: center; margin: 24px 0;">
          <a href="http://localhost:8080/events?slug={slug}" class="btn">View Hackathon & Register →</a>
        </div>
        """

        text_body = f"New Hackathon Announced: {event_name}!\n\n{tagline}\nPrize Pool: {prizes}\n\nRegister now: http://localhost:8080/events?slug={slug}\n\nDOGFOOD Team"

        results = []
        for r in recipients[:20]: # batch safeguard
            res = EmailService.send_email(
                to_email=r,
                subject=f"New Hackathon Launched: {event_name} ({prizes} Prize Pool) ⚡",
                html_content=EmailService._create_html_wrapper(
                    f"New Hackathon - {event_name}",
                    f"Registration is now open for {event_name}!",
                    html_body,
                ),
                text_content=text_body,
                template="new_hackathon_announcement",
            )
            results.append(res)
        return results

    @staticmethod
    def list_email_logs(limit: int = 50) -> List[Dict[str, Any]]:
        with engine.connect() as conn:
            stmt = select(email_logs_table).order_by(email_logs_table.c.created_at.desc()).limit(limit)
            rows = conn.execute(stmt).mappings().fetchall()
            return [dict(r) for r in rows]
