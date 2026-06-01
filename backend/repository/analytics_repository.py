from datetime import datetime, timedelta

from sqlalchemy.orm import Session
from sqlalchemy import func, desc, case

from automation.models.lead_posts import LeadPost
from automation.models.outreach import Outreach


def _safe_percent(numerator: int, denominator: int) -> float:
    if not denominator:
        return 0.0
    return round((numerator / denominator) * 100, 1)


def _month_start(value: datetime, months_back: int) -> datetime:
    month = value.month - months_back
    year = value.year
    while month <= 0:
        month += 12
        year -= 1
    return datetime(year, month, 1)


def _month_label(value: datetime) -> str:
    return value.strftime("%b")


def get_conversion_funnel(db: Session) -> dict:
    total_leads = db.query(LeadPost).count()
    discovered = db.query(LeadPost).filter(LeadPost.status == "discovered").count()
    qualified = db.query(LeadPost).filter(LeadPost.status == "qualified").count()

    # queued: outreach items that are pending/scheduled/ready/in_progress
    queued = db.query(Outreach).filter(Outreach.status.in_(["pending", "scheduled", "ready", "in_progress"])) .count()

    # sent: any outreach item that has actually been sent
    sent = db.query(Outreach).filter(Outreach.outreach_sent_at.isnot(None)).count()

    # replied: leads marked replied in lead_posts or outreach records
    replied_leads = db.query(LeadPost).filter(LeadPost.status == "replied").count()
    replied_outreach = db.query(Outreach).filter(Outreach.status == "replied").count()
    replied = replied_leads + replied_outreach

    converted = db.query(LeadPost).filter(LeadPost.status == "converted").count()

    return {
        "total_leads": total_leads,
        "discovered": discovered,
        "qualified": qualified,
        "queued": queued,
        "sent": sent,
        "replied": replied,
        "converted": converted,
    }


def get_overview_summary(db: Session) -> dict:
    funnel = get_conversion_funnel(db)
    avg_ai_score = db.query(func.avg(LeadPost.ai_score)).scalar() or 0

    return {
        "total_leads": funnel["total_leads"],
        "discovered_leads": funnel["discovered"],
        "qualified_leads": funnel["qualified"],
        "queue_pending": funnel["queued"],
        "outreach_sent": funnel["sent"],
        "replied": funnel["replied"],
        "converted": funnel["converted"],
        "avg_ai_score": round(float(avg_ai_score), 1),
        "reply_rate": _safe_percent(funnel["replied"], funnel["sent"]),
        "conversion_rate": _safe_percent(funnel["converted"], funnel["qualified"]),
        "qualification_rate": _safe_percent(funnel["qualified"], funnel["total_leads"]),
    }


def get_weekly_trends(db: Session) -> list:
    today = datetime.utcnow().date()
    week_start = today - timedelta(days=today.weekday())
    week_start_dt = datetime.combine(week_start, datetime.min.time())
    next_week_start_dt = week_start_dt + timedelta(days=7)

    day_rows = (
        db.query(
            func.date(LeadPost.created_utc).label("created_day"),
            func.count(LeadPost.id).label("leads"),
            func.sum(case((LeadPost.status == "qualified", 1), else_=0)).label("qualified"),
        )
        .filter(LeadPost.created_utc.isnot(None))
        .filter(LeadPost.created_utc >= week_start_dt)
        .filter(LeadPost.created_utc < next_week_start_dt)
        .group_by(func.date(LeadPost.created_utc))
        .all()
    )

    indexed_rows = {
        row.created_day: {
            "leads": int(row.leads or 0),
            "qualified": int(row.qualified or 0),
        }
        for row in day_rows
    }

    results = []
    for offset in range(7):
        current_date = week_start + timedelta(days=offset)
        date_key = current_date.isoformat()
        row = indexed_rows.get(date_key, {"leads": 0, "qualified": 0})
        results.append({
            "label": current_date.strftime("%a"),
            "date": date_key,
            "leads": row["leads"],
            "qualified": row["qualified"],
        })

    return results


def get_conversion_trends(db: Session, months: int = 5) -> list:
    today = datetime.utcnow().replace(day=1)
    start_month = _month_start(today, months - 1)

    rows = (
        db.query(
            func.strftime("%Y-%m", LeadPost.created_utc).label("month_key"),
            func.count(LeadPost.id).label("leads"),
            func.sum(case((LeadPost.status == "qualified", 1), else_=0)).label("qualified"),
            func.sum(case((LeadPost.status == "converted", 1), else_=0)).label("converted"),
        )
        .filter(LeadPost.created_utc.isnot(None))
        .filter(LeadPost.created_utc >= start_month)
        .group_by(func.strftime("%Y-%m", LeadPost.created_utc))
        .all()
    )

    indexed_rows = {
        row.month_key: {
            "leads": int(row.leads or 0),
            "qualified": int(row.qualified or 0),
            "converted": int(row.converted or 0),
        }
        for row in rows
        if row.month_key
    }

    results = []
    for offset in range(months - 1, -1, -1):
        month_date = _month_start(today, offset)
        month_key = month_date.strftime("%Y-%m")
        row = indexed_rows.get(month_key, {"leads": 0, "qualified": 0, "converted": 0})
        results.append({
            "month": _month_label(month_date),
            "month_key": month_key,
            "leads": row["leads"],
            "qualified": row["qualified"],
            "converted": row["converted"],
        })

    return results


def get_ai_qualification_trends(db: Session, months: int = 5) -> list:
    today = datetime.utcnow().replace(day=1)
    start_month = _month_start(today, months - 1)

    rows = (
        db.query(
            func.strftime("%Y-%m", LeadPost.created_utc).label("month_key"),
            func.sum(case((LeadPost.status == "qualified", 1), else_=0)).label("qualified"),
            func.avg(LeadPost.ai_score).label("avg_ai_score"),
        )
        .filter(LeadPost.created_utc.isnot(None))
        .filter(LeadPost.created_utc >= start_month)
        .group_by(func.strftime("%Y-%m", LeadPost.created_utc))
        .all()
    )

    indexed_rows = {
        row.month_key: {
            "qualified": int(row.qualified or 0),
            "avg_ai_score": round(float(row.avg_ai_score or 0), 1),
        }
        for row in rows
        if row.month_key
    }

    results = []
    for offset in range(months - 1, -1, -1):
        month_date = _month_start(today, offset)
        month_key = month_date.strftime("%Y-%m")
        row = indexed_rows.get(month_key, {"qualified": 0, "avg_ai_score": 0.0})
        results.append({
            "month": _month_label(month_date),
            "month_key": month_key,
            "qualified": row["qualified"],
            "avg_ai_score": row["avg_ai_score"],
        })

    return results


def get_reply_rate_by_day(db: Session) -> list:
    sent_at = func.coalesce(Outreach.outreach_sent_at, Outreach.scheduled_for, Outreach.created_utc)

    rows = (
        db.query(
            func.strftime("%w", sent_at).label("weekday_key"),
            func.count(Outreach.id).label("sent"),
            func.sum(case((Outreach.status == "replied", 1), else_=0)).label("replied"),
        )
        .filter(sent_at.isnot(None))
        .group_by(func.strftime("%w", sent_at))
        .all()
    )

    indexed_rows = {
        int(row.weekday_key): {
            "sent": int(row.sent or 0),
            "replied": int(row.replied or 0),
        }
        for row in rows
        if row.weekday_key is not None
    }

    order = [1, 2, 3, 4, 5, 6, 0]
    label_map = {1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 0: "Sun"}
    results = []

    for weekday_key in order:
        row = indexed_rows.get(weekday_key, {"sent": 0, "replied": 0})
        results.append({
            "day": label_map[weekday_key],
            "weekday_key": weekday_key,
            "sent": row["sent"],
            "replied": row["replied"],
            "reply_rate": _safe_percent(row["replied"], row["sent"]),
        })

    return results


def get_subreddit_performance(db: Session, limit: int = 5) -> list:
    results = (
        db.query(LeadPost.subreddit_name, func.count(LeadPost.id).label("leads"))
        .group_by(LeadPost.subreddit_name)
        .order_by(desc("leads"))
        .limit(limit)
        .all()
    )

    total = sum(int(row[1] or 0) for row in results)
    return [
        {
            "subreddit": row[0],
            "leads": int(row[1]),
            "percentage": _safe_percent(int(row[1] or 0), total),
        }
        for row in results
    ]


def get_dashboard_analytics(db: Session, limit: int = 5) -> dict:
    summary = get_overview_summary(db)
    subreddit_performance = get_subreddit_performance(db, limit)

    return {
        "summary": summary,
        "weekly_trends": get_weekly_trends(db),
        "conversion_trends": get_conversion_trends(db),
        "subreddit_performance": subreddit_performance,
        "reply_rate_by_day": get_reply_rate_by_day(db),
        "ai_qualification_trends": get_ai_qualification_trends(db),
        "top_subreddits": subreddit_performance,
    }


def get_top_subreddits(db: Session, limit: int = 5) -> list:
    return get_subreddit_performance(db, limit)


def get_top_subreddits(db: Session, limit: int = 5) -> list:
    results = (
        db.query(LeadPost.subreddit_name, func.count(LeadPost.id).label("leads"))
        .group_by(LeadPost.subreddit_name)
        .order_by(desc("leads"))
        .limit(limit)
        .all()
    )

    return [{"subreddit": row[0], "leads": int(row[1])} for row in results]
