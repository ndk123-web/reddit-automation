from math import ceil

from sqlalchemy import func
from datetime import datetime

from automation.models.outreach import Outreach
from automation.service.reddit_service import send_reddit_dm
from automation.utils.logger import add_log


def get_outreach_queue(page, limit, db):
    query = db.query(Outreach).filter(
        Outreach.status.in_(["pending", "scheduled", "ready", "in_progress"])
    )

    total = query.count()
    total_pages = max(1, ceil(total / limit)) if total else 1
    page = min(page, total_pages)
    skip = (page - 1) * limit

    items = (
        query.order_by(
            func.coalesce(
                Outreach.scheduled_for, Outreach.next_action_at, Outreach.created_utc
            ).asc(),
            Outreach.id.asc(),
        )
        .offset(skip)
        .limit(limit)
        .all()
    )

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
    }


def update_outreach_queue_item(db, item_id, outreach_content):
    item = db.query(Outreach).filter(Outreach.id == item_id).first()
    if not item:
        return None

    if outreach_content is not None:
        item.outreach_content = outreach_content

    db.commit()
    db.refresh(item)
    return item


def approve_outreach_queue_item(db, item_id):
    """Approve a queue item by sending the DM immediately.

    Success path:
    - send Reddit DM using the stored outreach_content
    - set outreach_sent_at
    - set status to 'sent'
    - clear last_error

    Failure path:
    - set status to 'failed'
    - store the exception message in last_error
    - do not set outreach_sent_at

    In both cases the item remains in the outreach table for audit/history,
    but it will no longer appear in the active queue.
    """
    item = db.query(Outreach).filter(Outreach.id == item_id).first()
    if not item:
        return None

    try:
        if not item.outreach_content:
            raise ValueError("Outreach content is empty; cannot send message.")

        subject = (
            "Discussion"
            if item.sequence_step in (None, "initial", "initial_sent")
            else "Following up"
        )
        send_reddit_dm(
            recipient=item.author_username,
            subject=subject,
            body=item.outreach_content,
        )

        item.status = "sent"
        item.outreach_sent_at = datetime.utcnow()
        item.last_error = None
        item.attempt_count = (item.attempt_count or 0) + 1
        db.commit()
        db.refresh(item)
        add_log(
            "OUTREACH_APPROVED_SENT",
            f"Approved and sent outreach DM to u/{item.author_username} for post {item.reddit_post_id}",
            "success",
        )
        return item
    except Exception as exc:
        item.status = "failed"
        item.last_error = str(exc)
        item.attempt_count = (item.attempt_count or 0) + 1
        db.commit()
        db.refresh(item)
        add_log(
            "OUTREACH_APPROVAL_FAILED",
            f"Failed to send approved outreach DM to u/{item.author_username}: {exc}",
            "error",
        )
        return item
