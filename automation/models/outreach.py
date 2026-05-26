from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime
from datetime import datetime

from automation.config.database import Base

class Outreach(Base):
    __tablename__ = "outreach"

    id = Column(Integer, primary_key=True)
    reddit_post_id = Column(String, unique=True)
    subreddit_name = Column(String)
    author_username = Column(String)
    title = Column(Text)
    content = Column(Text)
    post_url = Column(Text)
    ai_score = Column(Integer, nullable=True)
    ai_reason = Column(Text, nullable=True)
    status = Column(String, default="pending") # pending, scheduled, ready, in_progress, completed, failed, replied, opted_out
    sequence_step = Column(String, default="initial") # initial, followup_1, final_close
    outreach_method = Column(String) # e.g. "public_comment", "private_message"
    outreach_content = Column(Text) # the actual message/comment sent
    outreach_response = Column(Text) # any response received from the user
    scheduled_for = Column(DateTime, nullable=True)
    next_action_at = Column(DateTime, nullable=True)
    attempt_count = Column(Integer, default=0)
    last_error = Column(Text, nullable=True)
    created_utc = Column(DateTime)
    outreach_sent_at = Column(DateTime)