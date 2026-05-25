from sqlalchemy.orm import Session
from automation.models.lead_posts import LeadPost

def get_leads(db: Session, skip: int = 0, limit: int = 50, status: str = None, min_score: int = None, subreddit: str = None):
    query = db.query(LeadPost)
    if status:
        query = query.filter(LeadPost.status == status)
    if min_score is not None:
        query = query.filter(LeadPost.ai_score >= min_score)
    if subreddit:
        query = query.filter(LeadPost.subreddit_name == subreddit)
    
    total = query.count()
    items = query.order_by(LeadPost.created_utc.desc()).offset(skip).limit(limit).all()
    return {"items": items, "total": total}

def update_lead_status(db: Session, lead_id: int, status: str):
    lead = db.query(LeadPost).filter(LeadPost.id == lead_id).first()
    if lead:
        if status is not None:
            lead.status = status
        db.commit()
        db.refresh(lead)
    return lead

def delete_lead(db: Session, lead_id: int):
    lead = db.query(LeadPost).filter(LeadPost.id == lead_id).first()
    if lead:
        db.delete(lead)
        db.commit()
    return lead