import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.core.config import settings

logger = logging.getLogger("nivaran.notifications")

def send_notification_email(
    to_email: str,
    subject: str,
    body_text: str,
    complaint_number: Optional[str] = None
) -> bool:
    """
    Sends email notification if SMTP credentials are configured.
    Otherwise safely logs notification event WITHOUT sensitive details.
    """
    if not settings.SMTP_HOST or not settings.SMTP_USER:
        # Safe log for development/hackathon demonstration
        logger.info(
            f"[NOTIFICATION-DEV-MOCK] Notification triggered for recipient={to_email} | "
            f"complaint_ref={complaint_number or 'N/A'} | event={subject} (SMTP not configured)"
        )
        return True

    try:
        msg = MIMEMultipart()
        msg["From"] = settings.SMTP_FROM_EMAIL
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body_text, "plain"))

        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        logger.info(f"Email notification successfully sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to deliver email notification: {e}")
        return False
