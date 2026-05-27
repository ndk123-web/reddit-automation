from math import ceil

from sqlalchemy import func

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