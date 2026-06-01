from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from automation.config.database import SessionLocal
from backend.schemas.lead_schema import LeadUpdate
from backend.controller.lead_controller import fetch_leads, fetch_all_leads, modify_lead, remove_lead

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/leads")
def get_leads_route(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1),
    status: str = None,
    min_score: int = None,
    subreddit: str = None,
    db: Session = Depends(get_db)
):
    return fetch_leads(db, page, limit, status, min_score, subreddit)


@router.get("/leads/all")
def get_all_leads_route(
    status: str = None,
    min_score: int = None,
    subreddit: str = None,
    db: Session = Depends(get_db)
):
    return fetch_all_leads(db, status, min_score, subreddit)

@router.put("/leads/{lead_id}")
def update_lead_route(lead_id: int, data: LeadUpdate, db: Session = Depends(get_db)):
    updated_lead = modify_lead(db, lead_id, data)
    if not updated_lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return updated_lead

@router.delete("/leads/{lead_id}")
def delete_lead_route(lead_id: int, db: Session = Depends(get_db)):
    deleted = remove_lead(db, lead_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"status": "deleted"}