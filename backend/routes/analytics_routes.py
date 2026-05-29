from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from automation.config.database import SessionLocal
from backend.controller.analytics_controller import (
    fetch_conversion_funnel,
    fetch_analytics_summary,
    fetch_weekly_trends,
    fetch_conversion_trends,
    fetch_subreddit_performance,
    fetch_reply_rate_by_day,
    fetch_ai_qualification_trends,
    fetch_dashboard_analytics,
    fetch_top_subreddits,
    fetch_account_health,
)

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/analytics/overview")
def analytics_overview(db: Session = Depends(get_db)):
    """Return overview metrics and weekly trends for the dashboard."""
    return fetch_conversion_funnel(db)


@router.get("/analytics/metrics")
def analytics_metrics(db: Session = Depends(get_db)):
    """Return summary metrics for the analytics dashboard cards."""
    return fetch_analytics_summary(db)


@router.get("/analytics/weekly-trends")
def analytics_weekly_trends(db: Session = Depends(get_db)):
    """Return current-week lead and qualification trends."""
    return {"weekly_trends": fetch_weekly_trends(db)}


@router.get("/analytics/conversion-trends")
def analytics_conversion_trends(db: Session = Depends(get_db)):
    """Return monthly conversion trend data."""
    return {"conversion_trends": fetch_conversion_trends(db)}


@router.get("/analytics/subreddits")
def analytics_subreddits(limit: int = Query(5, ge=1, le=20), db: Session = Depends(get_db)):
    """Return top performing subreddits by lead count."""
    return {"top_subreddits": fetch_top_subreddits(db, limit)}


@router.get("/analytics/subreddit-performance")
def analytics_subreddit_performance(limit: int = Query(5, ge=1, le=20), db: Session = Depends(get_db)):
    """Return subreddit performance data with lead share percentages."""
    return {"subreddit_performance": fetch_subreddit_performance(db, limit)}


@router.get("/analytics/reply-rate-by-day")
def analytics_reply_rate_by_day(db: Session = Depends(get_db)):
    """Return reply rate grouped by weekday."""
    return {"reply_rate_by_day": fetch_reply_rate_by_day(db)}


@router.get("/analytics/qualification-trends")
def analytics_qualification_trends(db: Session = Depends(get_db)):
    """Return monthly AI qualification trends."""
    return {"ai_qualification_trends": fetch_ai_qualification_trends(db)}


@router.get("/analytics/dashboard")
def analytics_dashboard(limit: int = Query(5, ge=1, le=20), db: Session = Depends(get_db)):
    """Return the combined analytics payload used by the frontend dashboards."""
    return fetch_dashboard_analytics(db, limit)


@router.get("/analytics/health")
def account_health(db: Session = Depends(get_db)):
    """Return Reddit Account Health statistics."""
    return fetch_account_health(db)


@router.get("/analytics")
def analytics_root(db: Session = Depends(get_db)):
    """Deprecated root analytics endpoint kept for backward compatibility."""
    return analytics_overview(db)