from pydantic import BaseModel

class BlockUserSchema(BaseModel):
    username: str
    reason: str

