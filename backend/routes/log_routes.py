from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from automation.config.database import SessionLocal
from backend.controller.log_controller import fetch_logs

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/audit")
def get_logs_route(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1),
    db: Session = Depends(get_db)
):
    return fetch_logs(db, page, limit)