from sqlalchemy.orm import Session
from automation.models.logs import Logs

def get_logs(db: Session, skip: int = 0, limit: int = 50):
    total = db.query(Logs).count()
    items = db.query(Logs).order_by(Logs.created_at.desc()).offset(skip).limit(limit).all()
    return {"items": items, "total": total}