from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes.subreddit_routes import router as subreddit_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(subreddit_router)
