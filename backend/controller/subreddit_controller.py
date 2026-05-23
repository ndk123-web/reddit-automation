from backend.repository.subreddit_repository import get_all_subreddits, create_subreddit


def fetch_subreddits(db):
    return get_all_subreddits(db)


def add_subreddit(db, data):
    return create_subreddit(db, data)
