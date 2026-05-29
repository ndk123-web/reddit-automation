 # Analytics changes — backend & frontend

 This document lists the code changes made to add real analytics data, the new REST endpoints, expected JSON payload shapes, and how the frontend consumes them.

 ## Summary
 - Implemented SQL aggregation helpers in `backend/repository/analytics_repository.py`.
 - Added controller wrappers in `backend/controller/analytics_controller.py`.
 - Exposed analytics endpoints in `backend/routes/analytics_routes.py`.
 - Wired the frontend to use live data in `frontend/src/App.jsx` and replaced previously hard-coded chart data.

 ## Files changed
 - `backend/repository/analytics_repository.py`: new aggregation functions (overview summary, weekly trends, conversion trends, reply-rate-by-day, subreddit performance, AI qualification trends, conversion funnel).
 - `backend/controller/analytics_controller.py`: thin wrappers that call repository functions.
 - `backend/routes/analytics_routes.py`: routes for analytics endpoints and a combined `/analytics/dashboard` endpoint.
 - `frontend/src/App.jsx`: fetches `/analytics/dashboard` and renders charts (weekly trends, conversion trends, subreddit performance donut, reply-rate-by-day, AI qualification trends) from live data.

 ## Endpoints added (main)
 - `GET /analytics/dashboard` — combined payload with summary and series used by the frontend.
 - `GET /analytics/overview` — overview summary (counts + rates).
 - `GET /analytics/weekly-trends` — last N weeks, entries per week.
 - `GET /analytics/conversion-trends` — monthly series (leads, qualified, converted).
 - `GET /analytics/subreddit-performance` — top subreddits by lead counts.
 - `GET /analytics/reply-rate-by-day` — weekday series (sent, replied, reply_rate).
 - `GET /analytics/qualification-trends` — monthly qualified counts and avg AI score.

 If you need individual route names and signatures, see `backend/routes/analytics_routes.py`.

 ## Primary payload: `/analytics/dashboard` (example)

 {
   "summary": {
     "total_leads": 1234,
     "discovered_leads": 1000,
     "qualified_leads": 400,
     "queue_pending": 50,
     "outreach_sent": 300,
     "replied": 120,
     "converted": 30,
     "avg_ai_score": 0.78,
     "reply_rate": 0.4,
     "qualification_rate": 0.32,
     "conversion_rate": 0.075
   },
   "weekly_trends": [ { "label": "W1", "date": "2026-05-10", "leads": 50, "qualified": 10 }, ... ],
   "conversion_trends": [ { "month": "2026-01", "leads": 200, "qualified": 60, "converted": 10 }, ... ],
   "subreddit_performance": [ { "subreddit": "r/example", "leads": 120, "percentage": 12.5 }, ... ],
   "reply_rate_by_day": [ { "day": "Mon", "weekday_key": 1, "sent": 50, "replied": 20, "reply_rate": 0.4 }, ... ],
   "ai_qualification_trends": [ { "month": "2026-01", "qualified": 60, "avg_ai_score": 0.72 }, ... ],
   "top_subreddits": [ { "subreddit": "r/example", "leads": 120 }, ... ]
 }

 Notes:
 - Numeric rates are returned as floats between 0 and 1 (frontend multiplies by 100 when displaying percentages).
 - `subreddit_performance` includes `percentage` computed on the backend; frontend uses raw `leads` as well for safer rendering.

 ## How the frontend consumes the data
 - File: `frontend/src/App.jsx` — fetches `/analytics/dashboard` and stores two main objects in component state:
   - `analytics` — maps to `summary` in the payload.
   - `analyticsDashboard` — contains the series arrays (`weekly_trends`, `conversion_trends`, `subreddit_performance`, `reply_rate_by_day`, `ai_qualification_trends`, `top_subreddits`).

 - Charts render using these arrays. Subreddit chart uses raw `leads` to compute angles and handles edge cases (single-slice, zero total).

 ## Run / validate locally
 1. Start backend (FastAPI) as you normally do, e.g.:

 ```powershell
 uvicorn backend.main:app --reload --port 8000
 ```

 2. Start frontend dev server or build:

 ```bash
 # dev
 cd frontend
 npm run dev
 # or build
 npm run build
 ```

 3. Hit the combined endpoint to verify JSON:

 ```bash
 curl http://localhost:8000/analytics/dashboard | jq .
 ```

 ## Notes & edge-cases
 - Charts expect the backend to provide non-null numeric values. If your DB is empty, endpoints return zero/empty arrays — frontend guards prevent crashes.
 - Subreddit donut uses raw counts; percentages may be rounded on the client for display.
 - If you need additional fields (e.g., filtering by account or date ranges), I can add query parameters to the routes.

 ## Contact / next steps
 - If you want this doc translated to Hindi/Hinglish or split into smaller docs (API reference, frontend mapping, runbook), tell me which format you prefer and I'll add them.