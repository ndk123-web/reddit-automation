from automation.models.block_users import BlockedUser
from sqlalchemy.orm import Session
from datetime import datetime

def addBlockUserRepo(db: Session, username: str, reason: str):
    block_entry = BlockedUser(username=username, reason=reason, blocked_at=datetime.utcnow())
    db.add(block_entry)
    db.commit()
    db.refresh(block_entry)
    return block_entry

def getBlockedUsersRepo(db: Session):
    return db.query(BlockedUser).all()

def deleteBlockedUserRepo(db: Session, user_id: int):
    block_entry = db.query(BlockedUser).filter(BlockedUser.id == user_id).first()
    if block_entry:
        db.delete(block_entry)
        db.commit()
        return True
    
    return False