from sqlalchemy.orm import Session
from backend.repository.log_repository import get_logs

def fetch_logs(db: Session, page: int = 1, limit: int = 50):
    skip = (page - 1) * limit
    return get_logs(db, skip, limit)