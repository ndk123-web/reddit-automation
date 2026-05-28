from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from automation.config.database import SessionLocal
from automation.workers.reply_worker import run_reply_worker


router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/outreach/trigger-reply")
async def manual_reply_worker():
    try:
        success = run_reply_worker()
        if not success:
            raise HTTPException(status_code=423, detail="Reply worker is already running via scheduler or another process. Please wait.")
        return {"message": "Manual reply worker triggered successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error triggering manual reply worker: {str(e)}")