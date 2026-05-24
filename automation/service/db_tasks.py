from automation.config.database import SessionLocal
from automation.models.subreddit import Subreddit
from automation.models.lead_posts import LeadPost
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

        return allowed_monitored_subreddites
    except Exception as e:
        db.rollback()
        print(e)
    finally:
        db.close()


def store_lead_posts(lead_posts):

    db = SessionLocal()

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

    except Exception as e:
        db.rollback()
        print(e)

    finally:
        db.close()
