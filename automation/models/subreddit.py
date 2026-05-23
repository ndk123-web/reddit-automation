from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime
from datetime import datetime

from automation.config.database import Base


class Subreddit(Base):
    __tablename__ = "subreddits"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    active = Column(Boolean, default=True)
    dm_allowed = Column(Boolean, default=False)
    rules = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
