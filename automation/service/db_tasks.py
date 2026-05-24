from automation.config.database import SessionLocal
from automation.models.subreddit import Subreddit
from automation.models.lead_posts import LeadPost
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
