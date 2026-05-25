from sqlalchemy.orm import Session
from backend.repository.lead_repository import get_leads, update_lead_status, delete_lead

def fetch_leads(db: Session, page: int = 1, limit: int = 50, status: str = None, min_score: int = None, subreddit: str = None):
    skip = (page - 1) * limit
    return get_leads(db, skip, limit, status, min_score, subreddit)

def modify_lead(db: Session, lead_id: int, data):
    return update_lead_status(db, lead_id, data.status)

def remove_lead(db: Session, lead_id: int):
    return delete_lead(db, lead_id)