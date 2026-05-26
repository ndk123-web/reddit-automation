from __future__ import annotations

from datetime import datetime, timedelta
import os
import random

from automation.config.database import SessionLocal
from automation.models.lead_posts import LeadPost
from automation.models.outreach import Outreach
from automation.service.reddit_service import get_praw_client, send_reddit_dm
from automation.utils.logger import add_log, flush_logs


DEFAULT_WINDOW_START_HOUR = int(os.getenv("OUTREACH_WINDOW_START_HOUR", "10"))
DEFAULT_WINDOW_END_HOUR = int(os.getenv("OUTREACH_WINDOW_END_HOUR", "18"))
DEFAULT_SEND_BATCH_SIZE = int(os.getenv("OUTREACH_SEND_BATCH_SIZE", "1"))
QUALIFIED_SCORE_THRESHOLD = int(os.getenv("OUTREACH_SCORE_THRESHOLD", "7"))


def _build_initial_message(lead: LeadPost) -> str:
    return (
        f"Hi u/{lead.author_username},\n\n"
        f"I saw your post on r/{lead.subreddit_name} about: {lead.title[:180]}\n\n"
        f"It looked relevant to the kind of workflow and automation problems we help with. "
        "If you want, I can share a quick idea based on what you described.\n\n"
        "No pressure either way."
    )


def _random_schedule_time(now: datetime) -> datetime:
    start_hour = min(DEFAULT_WINDOW_START_HOUR, DEFAULT_WINDOW_END_HOUR)
    end_hour = max(DEFAULT_WINDOW_START_HOUR, DEFAULT_WINDOW_END_HOUR)

    window_start = now.replace(hour=start_hour, minute=0, second=0, microsecond=0)
    window_end = now.replace(hour=end_hour, minute=0, second=0, microsecond=0)

    if now < window_start:
        base_date = window_start
    elif now > window_end:
        base_date = window_start + timedelta(days=1)
        window_end = window_end + timedelta(days=1)
    else:
        base_date = now

    total_minutes = int((window_end - base_date).total_seconds() // 60)
    if total_minutes <= 0:
        return base_date

    offset_minutes = random.randint(0, total_minutes)
    return base_date + timedelta(minutes=offset_minutes)


def _queue_qualified_leads(db) -> int:
    leads = (
        db.query(LeadPost)
        .filter(LeadPost.status == "qualified")
        .filter(LeadPost.ai_score >= QUALIFIED_SCORE_THRESHOLD)
        .order_by(LeadPost.created_utc.asc())
        .limit(5)
        .all()
    )

    queued_count = 0
    for lead in leads:
        existing = (
            db.query(Outreach)
            .filter(Outreach.reddit_post_id == lead.reddit_post_id)
            .first()
        )
        if existing:
            continue

        scheduled_for = _random_schedule_time(datetime.utcnow())
        outreach = Outreach(
            reddit_post_id=lead.reddit_post_id,
            subreddit_name=lead.subreddit_name,
            author_username=lead.author_username,
            title=lead.title,
            content=lead.content,
            post_url=lead.post_url,
            ai_score=lead.ai_score,
            ai_reason=lead.ai_reason,
            status="pending",
            sequence_step="initial",
            outreach_method="private_message",
            outreach_content=_build_initial_message(lead),
            created_utc=lead.created_utc,
            scheduled_for=scheduled_for,
            next_action_at=scheduled_for,
        )
        db.add(outreach)
        lead.status = "queued"
        queued_count += 1

    if queued_count:
        db.commit()
    return queued_count


def _send_due_outreach(db) -> int:
    now = datetime.utcnow()
    due_items = (
        db.query(Outreach)
        .filter(Outreach.status.in_(["pending", "scheduled", "ready"]))
        .filter((Outreach.scheduled_for.is_(None)) | (Outreach.scheduled_for <= now))
        .order_by(Outreach.scheduled_for.asc().nullsfirst(), Outreach.created_utc.asc())
        .limit(DEFAULT_SEND_BATCH_SIZE)
        .all()
    )

    sent_count = 0
    reddit_client = get_praw_client()

    if not due_items:
        return 0

    for item in due_items:
        item.status = "in_progress"
        item.attempt_count = (item.attempt_count or 0) + 1
        db.commit()

        if reddit_client is None:
            item.status = "ready"
            item.last_error = "PRAW client unavailable; outreach held in ready state"
            db.commit()
            add_log(
                "OUTREACH_DRY_RUN",
                f"Outreach for u/{item.author_username} prepared but not sent because PRAW is unavailable",
                "info",
            )
            continue

        try:
            send_reddit_dm(
                recipient=item.author_username,
                subject="Quick follow-up",
                body=item.outreach_content or "",
            )
            item.status = "completed"
            item.outreach_sent_at = datetime.utcnow()
            item.sequence_step = "initial_sent"
            item.next_action_at = item.outreach_sent_at + timedelta(days=4)
            item.last_error = None
            db.commit()
            sent_count += 1
            add_log(
                "OUTREACH_SENT",
                f"Sent outreach DM to u/{item.author_username} for post {item.reddit_post_id}",
                "success",
            )
        except Exception as exc:
            item.status = "failed"
            item.last_error = str(exc)
            db.commit()
            add_log(
                "OUTREACH_ERROR",
                f"Failed sending outreach DM to u/{item.author_username}: {exc}",
                "error",
            )

    return sent_count


def run_outreach_worker():
    db = SessionLocal()
    add_log("OUTREACH_WORKER_START", "Starting outreach worker cycle", "info")

    try:
        queued_count = _queue_qualified_leads(db)
        sent_count = _send_due_outreach(db)

        add_log(
            "OUTREACH_WORKER_SUCCESS",
            f"Outreach worker queued {queued_count} leads and sent {sent_count} messages",
            "success",
        )
        print(f"Outreach worker completed: queued={queued_count}, sent={sent_count}")
    except Exception as exc:
        db.rollback()
        add_log("OUTREACH_WORKER_ERROR", f"Outreach worker failed: {exc}", "error")
        print(f"Outreach worker crashed: {exc}")
    finally:
        db.close()
        flush_logs()


if __name__ == "__main__":
    run_outreach_worker()