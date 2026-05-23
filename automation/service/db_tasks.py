from automation.config.database import SessionLocal
from automation.models.subreddit import Subreddit


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
    except:
        pass
    finally:
        db.close()
