from fastapi import FastAPI
from backend.routes.subreddit_routes import router as subreddit_router

app = FastAPI()

app.include_router(subreddit_router)
