from automation.config.database import Base 
from sqlalchemy import Column, Integer, String, DateTime

class BlockedUser(Base):
    __tablename__ = "blocked_users"

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, index=True)
    reason = Column(String)
    blocked_at = Column(DateTime)