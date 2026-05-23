from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from automation.config.database import SessionLocal
from backend.schemas.subreddit_schema import SubredditCreate
from backend.controller.subreddit_controller import fetch_subreddits, add_subreddit

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
