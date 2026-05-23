from automation.models.subreddit import Subreddit


def get_all_subreddits(db):
    return db.query(Subreddit).all()


def create_subreddit(db, data):
    subreddit = Subreddit(**data.dict())

    db.add(subreddit)

    db.commit()

    db.refresh(subreddit)

    return subreddit
