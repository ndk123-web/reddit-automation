# Automation System

This document explains what the automation side of the project currently does in the codebase.

The automation system is the backend runtime that continuously watches Reddit, scores leads, queues outreach, sends messages, and processes replies.

## Core Runtime Pieces

The automation layer is split into these main parts:

- `automation/workers/` for background jobs
- `automation/service/` for Reddit and AI integrations
- `automation/repository/` and `automation/service/db_tasks.py` for database helpers
- `automation/models/` for the SQLite ORM tables
- `automation/utils/` for logging and parsing helpers
- `automation/main_scheduler.py` for periodic job execution

## End-to-End Flow

The current automation pipeline works in this order:

1. Monitor worker fetches active subreddits from the database.
2. Reddit posts are fetched from each monitored subreddit.
3. AI scores each post and generates reasoning.
4. Qualified posts are stored as leads.
5. Outreach worker converts qualified leads into outreach queue items.
6. Outreach content is generated with AI personalization.
7. Each queue item gets a randomized send time inside the configured sending window.
8. Due outreach items are sent through the Reddit API.
9. Reply worker reads unread inbox messages.
10. Replies are matched back to the latest outreach record for the sender.
11. Normal replies are marked as replied.
12. Opt-out messages are marked as opted out and the user is added to the blocked list.
13. Logs are flushed to the audit log table.

## Workers

### 1. Monitor Worker

File: `automation/workers/monitor_worker.py`

Purpose:

- Discover new Reddit posts from monitored subreddits.
- Score them with the AI model.
- Store the results in the lead table.

What it does:

- Reads active subreddit names from the DB.
- Fetches recent posts from each subreddit using PRAW or the fallback Reddit fetch logic.
- Sends the collected posts to the AI scoring pipeline.
- Parses the AI response.
- Stores each post as a lead with:
  - Reddit post ID
  - subreddit name
  - author username
  - title
  - content
  - post URL
  - AI score
  - AI reasoning
  - discovered / qualified status
  - timestamps

Notes:

- A lock file prevents the same worker from running twice at the same time.
- The worker is designed to be triggered by the scheduler and can also be called manually.

### 2. Outreach Worker

File: `automation/workers/outreach_worker.py`

Purpose:

- Turn qualified leads into outreach queue items.
- Generate personalized messages.
- Schedule and send DMs in a natural-looking way.

What it does:

- Pulls leads with `status == qualified` and score above the threshold.
- Prevents duplicate outreach to the same username.
- Generates a personalized message with the AI service.
- Stores an `Outreach` record with:
  - recipient username
  - source post data
  - score and reasoning
  - message content
  - current sequence step
  - scheduled send time
  - next action time
- Randomizes the send time within the configured send window.
- Sends due messages through PRAW.
- Updates the outreach status after sending.
- Schedules follow-ups after the first send when the sequence continues.

Current statuses used by this worker:

- `pending`
- `ready`
- `in_progress`
- `waiting_for_followup_1`
- `waiting_for_final`
- `completed`
- `failed`

Important note:

- Reply inbox processing was split out of this worker so sending and reply detection are handled separately.

### 3. Reply Worker

File: `automation/workers/reply_worker.py`

Purpose:

- Read Reddit inbox replies.
- Detect normal replies and opt-out messages.
- Stop automation on users who reply or opt out.

What it does:

- Fetches unread inbox messages for the authenticated Reddit account.
- Matches the sender to the latest outreach item for that username.
- Stores the reply text on the outreach row.
- Clears any future scheduling fields.
- Marks the outreach row as:
  - `replied` for a normal reply
  - `opted_out` for a stop / unsubscribe style reply
- Updates the lead status to `replied` or `disqualified`.
- Adds opt-out users to the blocked user table.
- Marks inbox messages as read after processing.

Opt-out phrases currently checked:

- `stop`
- `not interested`
- `unsubscribe`
- `don't message`
- `do not contact`
- `no thanks`
- `please stop`

## Scheduler

File: `automation/main_scheduler.py`

Current job schedule:

- `run_monitor_worker` every 2 minutes
- `run_outreach_worker` every 1 minute
- `run_reply_worker` every 1 minute

The scheduler runs the workers with `max_instances=1` and `coalesce=True`.

Each worker also has its own lock file to avoid duplicate execution of the same worker process.

## Services Used by Automation

### Reddit service

File: `automation/service/reddit_service.py`

This module provides:

- PRAW client initialization
- subreddit post fetching
- inbox fetching
- DM sending
- public comment replies
- shadow-ban checks

### AI service

File: `automation/service/ai_service.py`

This module is responsible for:

- lead scoring
- personalized outreach generation

### DB tasks

File: `automation/service/db_tasks.py`

This module stores monitor results into SQLite and fetches active subreddits for the monitor worker.

## Data Tables Used by Automation

The main tables used by the workers are:

- `lead_posts`
- `outreach`
- `subreddit`
- `blocked_users`
- `logs`
- `settings`

## Logging Behavior

Automation events are logged through `automation/utils/logger.py`.

Current log flow:

- workers call `add_log(...)` for start, success, warning, and error events
- logs are buffered in memory
- `flush_logs()` writes the buffer to SQLite

This gives the dashboard a usable audit trail without writing every log row one-by-one.

## Current API / Dashboard Hooks

The automation layer is already exposed to the dashboard through backend routes.

Important current hooks:

- outreach queue can be fetched with pagination
- queue message content can be edited from the dashboard
- monitor, outreach, and reply workers can be triggered manually from the UI

## Current Safety / Control Notes

The current implementation includes these safeguards:

- worker lock files prevent duplicate process execution
- scheduled send times are randomized
- reply processing is separated from sending
- opt-out replies are written to the blocked user list
- queue sends only happen for due items

## Known Limitations

The current automation system works, but there are still a few things that should be improved before production use:

- The reply and outreach workers still rely on separate lock files instead of one shared global automation lock.
- Queue item claiming is not fully atomic yet.
- Reply matching is username-based, so future thread-level reply matching may need stronger correlation.
- Some route and worker behavior still assumes a single local runtime.

## Summary

The automation system currently handles:

- lead discovery
- AI lead scoring
- outreach queue creation
- scheduled DM sending
- inbox reply detection
- opt-out handling
- blocklist updates
- audit logging
- manual worker triggering from the dashboard

This is the main backend automation pipeline currently running in the repository.