from fastapi import APIRouter, Depends
from backend.schemas.block_user_schema import BlockUserSchema
from backend.controller.block_user_controller import addBlockUserController, getBlockedUsersController, deleteBlockedUserController
from sqlalchemy.orm import Session
from automation.config.database import SessionLocal

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/add-block-user")
def add_block_user(block_user: BlockUserSchema, db: Session = Depends(get_db)):
    """Add a user to the block list with a reason."""
    return addBlockUserController(db=db, username=block_user.username, reason=block_user.reason)


@router.get("/blocked-users")
def get_blocked_users(db: Session = Depends(get_db)):
    """Endpoint to retrieve blocked users."""
    return getBlockedUsersController(db=db)

@router.delete("/blocked-users/{user_id}")
def delete_blocked_user(user_id: int, db: Session = Depends(get_db)):
    """Endpoint to delete a blocked user by ID."""
    success = deleteBlockedUserController(db=db, user_id=user_id)
    if success:
        return {"message": "Blocked user deleted successfully."}
    else:
        return {"message": "Blocked user not found."}, 404