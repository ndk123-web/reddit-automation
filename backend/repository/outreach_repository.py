from math import ceil

from sqlalchemy import func
from datetime import datetime

from automation.models.outreach import Outreach


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
            func.coalesce(Outreach.scheduled_for, Outreach.next_action_at, Outreach.created_utc).asc(),
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
    """Mark an outreach queue item as approved/sent.

    This sets `status` to 'completed' and records `outreach_sent_at`.
    The item will therefore no longer appear in the active queue (which
    filters for pending/scheduled/ready/in_progress).
    """
    item = db.query(Outreach).filter(Outreach.id == item_id).first()
    if not item:
        return None

    item.status = "completed"
    item.outreach_sent_at = datetime.utcnow()
    try:
        item.attempt_count = (item.attempt_count or 0) + 1
    except Exception:
        item.attempt_count = 1

    db.commit()
    db.refresh(item)
    return item