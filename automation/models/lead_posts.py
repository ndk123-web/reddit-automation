from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime
from datetime import datetime

from automation.config.database import Base


class LeadPost(Base):

    __tablename__ = "lead_posts"

    id = Column(Integer, primary_key=True)
    reddit_post_id = Column(String, unique=True)
    subreddit_name = Column(String)
    author_username = Column(String)
    title = Column(Text)
    content = Column(Text)
    post_url = Column(Text)
    ai_score = Column(Integer)
    ai_reason = Column(Text)
    status = Column(String)
    created_utc = Column(DateTime)
    fetched_at = Column(DateTime)
