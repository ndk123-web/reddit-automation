from __future__ import annotations

from datetime import datetime, timedelta
import os
import random

from automation.config.database import SessionLocal
from automation.models.lead_posts import LeadPost
from automation.models.outreach import Outreach
from automation.service.reddit_service import get_praw_client, send_reddit_dm
from automation.service.ai_service import generate_personalized_outreach
from automation.utils.logger import add_log, flush_logs


DEFAULT_WINDOW_START_HOUR = int(os.getenv("OUTREACH_WINDOW_START_HOUR", "10"))
DEFAULT_WINDOW_END_HOUR = int(os.getenv("OUTREACH_WINDOW_END_HOUR", "18"))
DEFAULT_SEND_BATCH_SIZE = int(os.getenv("OUTREACH_SEND_BATCH_SIZE", "1"))
QUALIFIED_SCORE_THRESHOLD = int(os.getenv("OUTREACH_SCORE_THRESHOLD", "7"))


def _build_personalized_message(lead: LeadPost, sequence_step: str = "initial") -> str:
    return generate_personalized_outreach(
        post_title=lead.title,
        post_content=lead.content,
        author_username=lead.author_username,
        outreach_type="private_message",
        sequence_step=sequence_step
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
        # Username based duplication logic (global)
        existing_user = (
            db.query(Outreach)
            .filter(Outreach.author_username == lead.author_username)
            .first()
        )
        # Skip if they have already been contacted on another post
        if existing_user:
            lead.status = "rejected" # Mark as rejected due to global deduplication
            db.commit()
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
            outreach_content=_build_personalized_message(lead, "initial"),
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
                subject=("Discussion" if item.sequence_step == "initial" else "Following up"),
                body=item.outreach_content or "",
            )
            item.outreach_sent_at = datetime.utcnow()
            
            lead = db.query(LeadPost).filter(LeadPost.reddit_post_id == item.reddit_post_id).first()
            if lead:
               lead.status = "outreach_sent"
               
            if item.sequence_step == "initial":
                item.sequence_step = "initial_sent"
                item.status = "waiting_for_followup_1"
                item.scheduled_for = item.outreach_sent_at + timedelta(days=4)
                item.next_action_at = item.scheduled_for
            elif item.sequence_step == "followup_1":
                item.sequence_step = "followup_1_sent"
                item.status = "waiting_for_final"
                item.scheduled_for = item.outreach_sent_at + timedelta(days=5)
                item.next_action_at = item.scheduled_for
            else:
                item.sequence_step = "finished"
                item.status = "completed"
                item.scheduled_for = None
                item.next_action_at = None
                
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
        reddit_client = get_praw_client()
        
        # 1. Process Inbox for Replies (Reply Detection & Opt-outs)
        if reddit_client:
            try:
                unread_messages = list(reddit_client.inbox.unread(limit=None))
                for msg in unread_messages:
                    body = msg.body.lower()
                    author_name = msg.author.name if msg.author else None
                    
                    if author_name:
                        # Find existing outreach
                        existing_outreach = db.query(Outreach).filter(Outreach.author_username == author_name).first()
                        if existing_outreach:
                            if any(phrase in body for phrase in ["stop", "not interested", "unsubscribe", "don't message"]):
                                existing_outreach.status = "opted_out"
                                add_log("OUTREACH_OPT_OUT", f"User u/{author_name} opted out.", "warning")
                            else:
                                existing_outreach.status = "replied"
                                add_log("OUTREACH_REPLY", f"User u/{author_name} replied! Pausing automation.", "success")
                            existing_outreach.scheduled_for = None
                            existing_outreach.next_action_at = None
                            
                            # Also update the lead status
                            lead = db.query(LeadPost).filter(LeadPost.author_username == author_name).first()
                            if lead:
                                lead.status = "replied"
                            db.commit()
                    msg.mark_read()
            except Exception as e:
                add_log("INBOX_ERROR", f"Failed to check inbox: {e}", "error")

        # 2. Stage new leads to Outreach
        queued_count = _queue_qualified_leads(db)
        
        # 3. Process Sequence Steps
        now = datetime.utcnow()
        waiting_followups = db.query(Outreach).filter(
            Outreach.status.in_(["waiting_for_followup_1", "waiting_for_final"]),
            Outreach.scheduled_for <= now
        ).all()
        
        for item in waiting_followups:
            if item.status == "waiting_for_followup_1":
                new_step = "followup_1"
            else:
                new_step = "final_close"
                
            lead = db.query(LeadPost).filter(LeadPost.reddit_post_id == item.reddit_post_id).first()
            if lead:
                item.outreach_content = _build_personalized_message(lead, new_step)
                item.sequence_step = new_step
                item.status = "ready"
                db.commit()

        # 4. Send due messages
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