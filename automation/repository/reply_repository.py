from datetime import datetime

from automation.models.block_users import BlockedUser
from automation.models.lead_posts import LeadPost
from automation.models.outreach import Outreach


OPT_OUT_PHRASES = [
    "stop",
    "not interested",
    "unsubscribe",
    "don't message",
    "do not contact",
    "no thanks",
    "please stop",
]


def _is_opt_out_message(message_body: str) -> bool:
    lowered = (message_body or "").lower()
    return any(phrase in lowered for phrase in OPT_OUT_PHRASES)


def _find_outreach_item(db, author_username: str):
    return (
        db.query(Outreach)
        .filter(Outreach.author_username == author_username)
        .order_by(Outreach.created_utc.desc())
        .first()
    )


def _find_lead_post(db, author_username: str):
    return (
        db.query(LeadPost)
        .filter(LeadPost.author_username == author_username)
        .order_by(LeadPost.created_utc.desc())
        .first()
    )


def _add_blocked_user(db, username: str, reason: str):
    existing = db.query(BlockedUser).filter(BlockedUser.username == username).first()
    if existing:
        existing.reason = reason
        if not existing.blocked_at:
            existing.blocked_at = datetime.utcnow()
        return existing

    blocked_user = BlockedUser(
        username=username,
        reason=reason,
        blocked_at=datetime.utcnow(),
    )
    db.add(blocked_user)
    return blocked_user


def process_inbox_replies(db, unread_messages):
    processed = 0
    replied = 0
    opted_out = 0

    for message in unread_messages:
        author = getattr(message, "author", None)
        author_username = getattr(author, "name", None) if author else None
        if not author_username:
            try:
                message.mark_read()
            except Exception:
                pass
            continue

        message_body = getattr(message, "body", "") or ""
        outreach_item = _find_outreach_item(db, author_username)
        if not outreach_item:
            try:
                message.mark_read()
            except Exception:
                pass
            continue

        processed += 1
        outreach_item.outreach_response = message_body
        outreach_item.scheduled_for = None
        outreach_item.next_action_at = None

        lead_post = _find_lead_post(db, author_username)

        if _is_opt_out_message(message_body):
            outreach_item.status = "opted_out"
            if lead_post:
                lead_post.status = "disqualified"
            _add_blocked_user(
                db,
                author_username,
                "Auto opt-out detected from Reddit reply",
            )
            opted_out += 1
        else:
            outreach_item.status = "replied"
            if lead_post:
                lead_post.status = "replied"
            replied += 1

        try:
            message.mark_read()
        except Exception:
            pass

    db.commit()
    return {
        "processed": processed,
        "replied": replied,
        "opted_out": opted_out,
    }