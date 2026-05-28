from pydantic import BaseModel
from typing import Optional


class OutreachUpdate(BaseModel):
    outreach_content: Optional[str] = None