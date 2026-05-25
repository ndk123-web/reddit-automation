from backend.repository.subreddit_repository import get_all_subreddits, create_subreddit, delete_subreddit, deactive_subreddit, active_subreddit


def fetch_subreddits(db):
    return get_all_subreddits(db)


def add_subreddit(db, data):
    return create_subreddit(db, data)


def remove_subreddit(db, subreddit_id):
    return delete_subreddit(db, subreddit_id)

def deactivate_subreddit(db, subreddit_name):
    return deactive_subreddit(db, subreddit_name)

def activate_subreddit(db, subreddit_name):
    return active_subreddit(db, subreddit_name)