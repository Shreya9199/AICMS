import random
import string
from datetime import datetime
from typing import Dict, Set
from app.models import ComplaintStatus

# Nonsequential public complaint number generator: e.g. NIV-2026-X8K2M
def generate_complaint_number() -> str:
    year = datetime.utcnow().year
    charset = string.ascii_uppercase.replace("O", "").replace("I", "") + "23456789"
    random_part = "".join(random.choices(charset, k=5))
    return f"NIV-{year}-{random_part}"

# Allowed workflow transitions
ALLOWED_TRANSITIONS: Dict[str, Set[str]] = {
    ComplaintStatus.SUBMITTED: {
        ComplaintStatus.UNDER_REVIEW,
        ComplaintStatus.ASSIGNED,
        ComplaintStatus.ESCALATED,
        ComplaintStatus.CLOSED
    },
    ComplaintStatus.UNDER_REVIEW: {
        ComplaintStatus.ASSIGNED,
        ComplaintStatus.IN_PROGRESS,
        ComplaintStatus.WAITING_FOR_INFORMATION,
        ComplaintStatus.ESCALATED,
        ComplaintStatus.RESOLVED,
        ComplaintStatus.CLOSED
    },
    ComplaintStatus.ASSIGNED: {
        ComplaintStatus.IN_PROGRESS,
        ComplaintStatus.WAITING_FOR_INFORMATION,
        ComplaintStatus.ESCALATED,
        ComplaintStatus.RESOLVED,
        ComplaintStatus.CLOSED
    },
    ComplaintStatus.IN_PROGRESS: {
        ComplaintStatus.WAITING_FOR_INFORMATION,
        ComplaintStatus.ESCALATED,
        ComplaintStatus.RESOLVED,
        ComplaintStatus.CLOSED
    },
    ComplaintStatus.WAITING_FOR_INFORMATION: {
        ComplaintStatus.IN_PROGRESS,
        ComplaintStatus.RESOLVED,
        ComplaintStatus.CLOSED,
        ComplaintStatus.ESCALATED
    },
    ComplaintStatus.ESCALATED: {
        ComplaintStatus.IN_PROGRESS,
        ComplaintStatus.RESOLVED,
        ComplaintStatus.CLOSED
    },
    ComplaintStatus.RESOLVED: {
        ComplaintStatus.CLOSED,
        ComplaintStatus.IN_PROGRESS  # Can reopen if complainant appeals
    },
    ComplaintStatus.CLOSED: {
        ComplaintStatus.UNDER_REVIEW  # Rare reopen
    }
}

def is_transition_allowed(old_status: str, new_status: str) -> bool:
    if old_status == new_status:
        return True
    allowed = ALLOWED_TRANSITIONS.get(old_status, set())
    return new_status in allowed
