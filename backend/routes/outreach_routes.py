from fastapi import APIRouter, Depends, Query, HTTPException
from backend.controller.outreach_controller import getQueueOutreach, updateQueueOutreach
from automation.config.database import SessionLocal
from sqlalchemy.orm import Session
from backend.schemas.outreach_schema import OutreachUpdate

router = APIRouter()

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.get("/outreach/queue")
def get_outreach_queue(page: int = Query(1, ge=1),limit: int = Query(50, ge=1), db: Session = Depends(get_db)):
    return getQueueOutreach(page,limit,db)


@router.put("/outreach/queue/{item_id}")
def update_outreach_queue(item_id: int, data: OutreachUpdate, db: Session = Depends(get_db)):
    updated_item = updateQueueOutreach(item_id, data, db)
    if not updated_item:
        raise HTTPException(status_code=404, detail="Outreach queue item not found")
    return updated_item