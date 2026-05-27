from fastapi import APIRouter, Depends, Query
from backend.controller.outreach_controller import getQueueOutreach
from automation.config.database import SessionLocal
from sqlalchemy.orm import Session

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