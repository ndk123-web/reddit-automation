from pydantic import BaseModel
from typing import Optional

class LeadUpdate(BaseModel):
    status: Optional[str] = None