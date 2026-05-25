from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from automation.config.database import SessionLocal
from backend.schemas.subreddit_schema import SubredditCreate
from backend.controller.subreddit_controller import fetch_subreddits, add_subreddit, remove_subreddit, deactivate_subreddit, activate_subreddit

router = APIRouter()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.get("/subreddits")
def get_subreddits(db: Session = Depends(get_db)):
    return fetch_subreddits(db)


@router.post("/subreddits")
def create_subreddit_route(data: SubredditCreate, db: Session = Depends(get_db)):
    return add_subreddit(db, data)


@router.delete("/subreddits/{subreddit_id}")
def delete_subreddit_route(subreddit_id: int, db: Session = Depends(get_db)):
    deleted = remove_subreddit(db, subreddit_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Subreddit not found")
    return {"message": "Subreddit deleted successfully"}

@router.put("/subreddits/{subreddit_name}/deactivate")
def deactivate_subreddit_route(subreddit_name: str, db: Session = Depends(get_db)):
    deactivated = deactivate_subreddit(db, subreddit_name)
    if not deactivated:
        raise HTTPException(status_code=404, detail="Subreddit not found or already deactivated")
    return {"message": "Subreddit deactivated successfully"}

@router.put("/subreddits/{subreddit_name}/activate")
def activate_subreddit_route(subreddit_name: str, db: Session = Depends(get_db)):
    activated = activate_subreddit(db, subreddit_name)
    if not activated:
        raise HTTPException(status_code=404, detail="Subreddit not found or already active")
    return {"message": "Subreddit activated successfully"}
