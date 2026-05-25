from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from automation.config.database import SessionLocal
from automation.models.lead_posts import LeadPost

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db)):
    total_leads = db.query(LeadPost).count()
    discovered_leads = db.query(LeadPost).filter(LeadPost.status == "discovered").count()
    qualified_leads = db.query(LeadPost).filter(LeadPost.status == "qualified").count()
    outreach_sent = db.query(LeadPost).filter(LeadPost.status == "outreach_sent").count()
    replied = db.query(LeadPost).filter(LeadPost.status == "replied").count()
    
    conversion_rate = round((replied / outreach_sent * 100), 1) if outreach_sent > 0 else 0
    
    return {
        "total_leads": total_leads,
        "discovered_leads": discovered_leads,
        "qualified_leads": qualified_leads,
        "outreach_sent": outreach_sent,
        "replied": replied,
        "conversion_rate": conversion_rate
    }