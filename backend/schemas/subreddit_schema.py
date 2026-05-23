from pydantic import BaseModel


class SubredditCreate(BaseModel):
    name: str
    active: bool
    dm_allowed: bool
    rules: str
