from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from automation.models.lead_posts import LeadPost
from automation.models.outreach import Outreach


def get_conversion_funnel(db: Session) -> dict:
    discovered = db.query(LeadPost).filter(LeadPost.status == "discovered").count()
    qualified = db.query(LeadPost).filter(LeadPost.status == "qualified").count()

    # queued: outreach items that are pending/scheduled/ready/in_progress
    queued = db.query(Outreach).filter(Outreach.status.in_(["pending", "scheduled", "ready", "in_progress"])) .count()

    # sent: outreach completed
    sent = db.query(Outreach).filter(Outreach.status == "completed").count()

    # replied: leads marked replied in lead_posts or outreach records
    replied_leads = db.query(LeadPost).filter(LeadPost.status == "replied").count()
    replied_outreach = db.query(Outreach).filter(Outreach.status == "replied").count()
    replied = replied_leads + replied_outreach

    converted = db.query(LeadPost).filter(LeadPost.status == "converted").count()

    return {
        "discovered": discovered,
        "qualified": qualified,
        "queued": queued,
        "sent": sent,
        "replied": replied,
        "converted": converted,
    }


def get_top_subreddits(db: Session, limit: int = 5) -> list:
    results = (
        db.query(LeadPost.subreddit_name, func.count(LeadPost.id).label("leads"))
        .group_by(LeadPost.subreddit_name)
        .order_by(desc("leads"))
        .limit(limit)
        .all()
    )

    return [{"subreddit": row[0], "leads": int(row[1])} for row in results]
