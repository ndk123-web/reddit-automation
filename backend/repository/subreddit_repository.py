from automation.models.subreddit import Subreddit


def get_all_subreddits(db):
    return db.query(Subreddit).all()


def create_subreddit(db, data):
    subreddit = Subreddit(**data.dict())

    db.add(subreddit)

    db.commit()

    db.refresh(subreddit)

    return subreddit


def delete_subreddit(db, subreddit_id):
    subreddit = db.query(Subreddit).filter(Subreddit.id == subreddit_id).first()
    if subreddit:
        db.delete(subreddit)
        db.commit()
    return subreddit
