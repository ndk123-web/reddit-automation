from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from automation.config.database import SessionLocal
from backend.controller.analytics_controller import fetch_conversion_funnel, fetch_top_subreddits, fetch_account_health

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/analytics/overview")
def analytics_overview(db: Session = Depends(get_db)):
    """Return conversion funnel counts for dashboard overview."""
    return fetch_conversion_funnel(db)


@router.get("/analytics/subreddits")
def analytics_subreddits(limit: int = Query(5, ge=1, le=20), db: Session = Depends(get_db)):
    """Return top performing subreddits by lead count."""
    return {"top_subreddits": fetch_top_subreddits(db, limit)}


@router.get("/analytics/health")
def account_health(db: Session = Depends(get_db)):
    """Return Reddit Account Health statistics."""
    return fetch_account_health(db)


@router.get("/analytics")
def analytics_root(db: Session = Depends(get_db)):
    """Deprecated root analytics endpoint kept for backward compatibility."""
    return analytics_overview(db)