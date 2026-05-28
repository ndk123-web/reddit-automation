from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes.subreddit_routes import router as subreddit_router
from backend.routes.lead_routes import router as lead_router
from backend.routes.log_routes import router as log_router
from backend.routes.analytics_routes import router as analytics_router
from backend.routes.manual_worker_routes import router as manual_worker_router
from backend.routes.outreach_routes import router as outreach_router
from backend.routes.block_user_routes import router as block_user_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000", "http://localhost:5173"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(subreddit_router)
app.include_router(lead_router)
app.include_router(log_router)
app.include_router(analytics_router)
app.include_router(manual_worker_router)
app.include_router(outreach_router)
app.include_router(block_user_router)
