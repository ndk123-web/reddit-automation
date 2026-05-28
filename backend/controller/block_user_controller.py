from backend.repository.block_user_repository import addBlockUserRepo, getBlockedUsersRepo, deleteBlockedUserRepo
from sqlalchemy.orm import Session

def addBlockUserController(db: Session, username: str, reason: str):
    return addBlockUserRepo(db=db, username=username, reason=reason)

def getBlockedUsersController(db: Session):
    return getBlockedUsersRepo(db=db)

def deleteBlockedUserController(db: Session, user_id: int):
    return deleteBlockedUserRepo(db=db, user_id=user_id)
