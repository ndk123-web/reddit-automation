from sqlalchemy.orm import Session
from backend.repository.analytics_repository import get_conversion_funnel, get_top_subreddits
from automation.service.reddit_service import get_praw_client, check_shadowban
from automation.models.logs import Logs
from datetime import datetime, timedelta
import os
import random

def fetch_conversion_funnel(db: Session):
    return get_conversion_funnel(db)


def fetch_top_subreddits(db: Session, limit: int = 5):
    return get_top_subreddits(db, limit)


def fetch_account_health(db: Session):
    client = get_praw_client()
    username = os.getenv("REDDIT_USERNAME")
    
    # Calculate daily count from DB logs
    today = datetime.utcnow().date()
    today_start = datetime(today.year, today.month, today.day)
    
    daily_count = db.query(Logs).filter(
        Logs.event_type.in_(["REDDIT_DM_SUCCESS", "REDDIT_COMMENT_SUCCESS"]),
        Logs.created_at >= today_start
    ).count()

    # Fallback/Mock data if OAuth is missing
    if not client or not username:
        return {
            "karma": "N/A (No Auth)",
            "shadowbanStatus": "Unknown",
            "rateLimit": 0,
            "dailyCount": daily_count,
            "dailyLimit": 100,
            "status": "No PRAW Credentials"
        }
    
    try:
        # PRAW fetch
        me = client.user.me()
        karma = me.link_karma + me.comment_karma
        
        # Check shadowban (though `me()` working usually implies you aren't fully suspended, 
        # it's still good to check via our scrape tool if we want to confirm public visibility)
        is_shadowbanned = check_shadowban(username)
        
        # Rate limit estimation: PRAW holds limits in `client.auth.limits` after a request
        # If no requests made yet, it will be empty
        rates = client.auth.limits
        used = rates.get('used', 0)
        remaining = rates.get('remaining', 100)
        
        total_limit = used + remaining
        if total_limit == 0:
            total_limit = 100
            
        rate_percent = int((remaining / total_limit) * 100)
        
        return {
            "karma": karma,
            "shadowbanStatus": "Banned/Suspended" if is_shadowbanned else "Healthy",
            "rateLimit": rate_percent,
            "dailyCount": daily_count,
            "dailyLimit": 50,
            "status": "Connected"
        }
    except Exception as e:
        return {
            "karma": "Error",
            "shadowbanStatus": "Unknown",
            "rateLimit": 0,
            "dailyCount": daily_count,
            "dailyLimit": 100,
            "status": f"Error: {e}"
        }
