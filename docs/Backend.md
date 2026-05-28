## Backend Overview

This project uses FastAPI as the API layer, SQLite as the local database, PRAW for Reddit access, APScheduler for worker execution, and React for the dashboard UI.

The backend is split into three layers:

- `routes/` exposes HTTP endpoints.
- `controller/` keeps request handling thin and forwards to repository logic.
- `repository/` contains the actual database operations.

The automation runtime lives under `automation/` and contains the workers, service integrations, database helpers, and model definitions.

## Current Data Model

The main entities currently in use are:

- `LeadPost`: raw and scored Reddit posts discovered by the monitor worker.
- `Outreach`: queued, scheduled, sent, replied, failed, and opt-out outreach records.
- `Subreddit`: monitored subreddit configuration.
- `Keyword`: keyword filters for lead discovery.
- `BlockedUser`: permanent do-not-contact records.
- `Logs`: audit and worker event history.
- `Settings`: configuration values for scoring and outreach limits.

### Outreach record fields currently used

- `reddit_post_id`
- `subreddit_name`
- `author_username`
- `title`
- `content`
- `post_url`
- `ai_score`
- `ai_reason`
- `status`
- `sequence_step`
- `outreach_method`
- `outreach_content`
- `outreach_response`
- `scheduled_for`
- `next_action_at`
- `attempt_count`
- `last_error`
- `created_utc`
- `outreach_sent_at`

## Worker Architecture

There are now three separate worker responsibilities:

- `monitor_worker.py`: fetches subreddit posts, scores them with AI, and stores qualified leads.
- `outreach_worker.py`: stages qualified leads into outreach, generates personalized messages, schedules sending, and sends due DMs.
- `reply_worker.py`: reads unread inbox messages, detects replies and opt-outs, updates outreach state, and blocks users when needed.

### Monitor worker

Current behavior:

- Fetches active subreddits from the database.
- Pulls new posts from each subreddit using PRAW.
- Scores posts using the AI scoring pipeline.
- Stores all discovered leads in SQLite.
- Marks leads as `qualified` or `discovered` based on score.

### Outreach worker

Current behavior:

- Converts qualified leads into `Outreach` rows.
- Prevents duplicate outreach to the same username.
- Generates personalized DM content using the AI message generator.
- Schedules outreach inside a random window between the configured start and end hours.
- Moves items through states such as `pending`, `ready`, `in_progress`, `waiting_for_followup_1`, `waiting_for_final`, and `completed`.

### Reply worker

Current behavior:

- Reads unread Reddit inbox messages from the authenticated account.
- Matches reply messages back to the latest outreach item for the sender.
- Detects opt-out phrases such as `stop`, `not interested`, `unsubscribe`, `don't message`, `do not contact`, `no thanks`, and `please stop`.
- Marks normal replies as `replied`.
- Marks opt-outs as `opted_out`.
- Updates the associated lead status.
- Adds opted-out users to the blocked list with a timestamp and reason.
- Clears future follow-up scheduling so the automation stops on that thread.

## Scheduler

The scheduler currently runs these jobs:

- `run_monitor_worker` every 2 minutes.
- `run_outreach_worker` every 1 minute.
- `run_reply_worker` every 1 minute.

Each worker also uses its own lock file to prevent overlapping execution of the same worker process.

## API Endpoints

### Outreach queue

- `GET /outreach/queue?page=&limit=`
- Returns paginated queue data.
- Response shape now includes `items`, `total`, `page`, `limit`, and `total_pages`.

### Outreach update

- `PUT /outreach/queue/{item_id}`
- Updates the `outreach_content` for a queued outreach item.

### Outreach trigger

- `POST /outreach/trigger-monitor`
- `POST /outreach/trigger-queue`
- `POST /outreach/trigger-reply`

### Existing supporting endpoints

- leads
- logs
- subreddits
- keywords
- blocked users
- settings
- analytics

## Frontend Contract Notes

The dashboard now expects the queue API to return pagination metadata. It also uses the outreach update endpoint for the queue drawer save action.

The queue drawer currently supports:

- editing the message content
- saving back to the backend
- refreshing the queue after save
- displaying the real scheduled time instead of a hardcoded placeholder

The top bar also now exposes a manual `Process Replies` button that calls the reply worker trigger endpoint.

## Compliance and Safety Notes

Important current guardrails:

- Reddit access uses PRAW with OAuth credentials.
- Queue sending is randomized inside a configurable send window.
- Reply handling is isolated from sending so inbox processing can pause outreach cleanly.
- Opt-outs are persisted in the block list.

## Current Gaps / Follow-Up Work

The current implementation is functional for Phase 1, but still has follow-up work:

- unify the worker lock strategy so multiple workers do not overlap on shared records
- add atomic claim logic for outreach rows
- expand reply detection to support thread-level replies and more robust match rules
- add richer dashboard views for replied, opted-out, and follow-up states
- document the production migration and compliance notes in a separate phase 2 file

## Summary

The backend now covers the core outreach pipeline end to end:

- monitor subreddit posts
- score and store leads
- queue personalized outreach
- schedule and send DMs
- detect replies and opt-outs
- persist audit logs
- expose queue editing from the dashboard
