from sqlalchemy.orm import Session
from backend.repository.analytics_repository import get_conversion_funnel, get_top_subreddits


def fetch_conversion_funnel(db: Session):
    return get_conversion_funnel(db)


def fetch_top_subreddits(db: Session, limit: int = 5):
    return get_top_subreddits(db, limit)
