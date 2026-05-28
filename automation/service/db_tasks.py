import pprint

from automation.config.database import SessionLocal
from automation.models.subreddit import Subreddit
from automation.models.lead_posts import LeadPost
from automation.models.settings import Settings
from automation.utils.logger import add_log
from datetime import datetime


def fetch_subreddits():
    db = SessionLocal()

    try:
        allowed_monitored_subreddites = (
            db.query(Subreddit).filter(Subreddit.active == True).all()
        )

        # filter
        allowed_monitored_subreddites = [
            subreddit.name for subreddit in allowed_monitored_subreddites
        ]

        print("DB task: ", allowed_monitored_subreddites)
        add_log("DB_FETCH_SUBREDDITS", f"Fetched {len(allowed_monitored_subreddites)} active subreddits", "success")
        return allowed_monitored_subreddites
    except Exception as e:
        db.rollback()
        print(e)
        add_log("DB_ERROR", f"fetch_subreddits failed: {str(e)}", "error")
        return []
    finally:
        db.close()


def store_lead_posts(lead_posts):

    db = SessionLocal()
    add_log("DB_STORE_LEADS_START", f"Starting insertion of {len(lead_posts)} new leads", "info")

    try:

        for post in lead_posts:

            existing_post = (
                db.query(LeadPost)
                .filter(LeadPost.reddit_post_id == post["reddit_post_id"])
                .first()
            )

            if existing_post:
                continue

            lead_post = LeadPost(
                reddit_post_id=post["reddit_post_id"],
                subreddit_name=post["subreddit_name"],
                author_username=post["author_username"],
                title=post["title"],
                content=post["content"],
                post_url=post["post_url"],
                ai_score=post["ai_score"],
                ai_reason=post["ai_reason"],
                status=post["status"],
                created_utc=post["created_utc"],
                fetched_at=datetime.utcnow(),
            )

            db.add(lead_post)

        db.commit()
        add_log("DB_STORE_LEADS_SUCCESS", "Successfully committed valid leads to DB", "success")

    except Exception as e:
        db.rollback()
        print(e)
        add_log("DB_ERROR", f"store_lead_posts failed: {str(e)}", "error")

    finally:
        db.close()

def fetch_min_score():
    
    db = SessionLocal()
    
    try:
        setting = (
            db.query(Settings)
            .filter(Settings.key.in_(["min_score", "score_threshold"]))
            .order_by(Settings.id.asc())
            .first()
        )
        min_score = int(setting.value) if setting and str(setting.value).isdigit() else None
        add_log("DB_FETCH_MIN_SCORE", f"Fetched min_score setting: {min_score}", "success")
        
        pprint.pprint(f"Fetched min_score from DB: {min_score}")
        
        # Default to 7 if not set or invalid
        return min_score if min_score is not None else 7
    except Exception as e:
        db.rollback()
        print(e)
        add_log("DB_ERROR", f"fetch_min_score failed: {str(e)}", "error")
        return None
    finally:       
        db.close()


def fetch_outreach_window():
    db = SessionLocal()

    try:
        start_setting = (
            db.query(Settings)
            .filter(Settings.key.in_(["outreach_window_start_hour", "outreach_window_start"]))
            .order_by(Settings.id.asc())
            .first()
        )
        end_setting = (
            db.query(Settings)
            .filter(Settings.key.in_(["outreach_window_end_hour", "outreach_window_end"]))
            .order_by(Settings.id.asc())
            .first()
        )

        start_hour = int(start_setting.value) if start_setting and str(start_setting.value).isdigit() else 10
        end_hour = int(end_setting.value) if end_setting and str(end_setting.value).isdigit() else 18

        add_log(
            "DB_FETCH_OUTREACH_WINDOW",
            f"Fetched outreach window: {start_hour}-{end_hour}",
            "success",
        )
        return start_hour, end_hour
    except Exception as e:
        db.rollback()
        print(e)
        add_log("DB_ERROR", f"fetch_outreach_window failed: {str(e)}", "error")
        return 10, 18
    finally:
        db.close()
    
    
if __name__ == "__main__":
    fetch_min_score()