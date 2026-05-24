from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime
from datetime import datetime
from automation.config.database import Base 

class Logs(Base):
    __tablename__ = "logs"
    
    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)