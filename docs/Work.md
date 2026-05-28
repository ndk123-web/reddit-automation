## Project Status

This document tracks what has already been implemented in the current codebase.

## Completed So Far

### Architecture and setup

- FastAPI backend is in place.
- React dashboard is in place.
- SQLite is being used as the local data store.
- PRAW is used for Reddit API access.
- APScheduler is used for periodic worker execution.

### Lead discovery pipeline

- Subreddit monitoring worker fetches active subreddits from the DB.
- Posts are fetched from Reddit.
- AI scoring runs against the fetched posts.
- Leads are stored with score, reasoning, author, subreddit, and URL.
- Deduplication is applied so repeated post IDs are not inserted twice.

### Outreach queue pipeline

- Qualified leads are staged into the `outreach` table.
- Personalized outreach content is generated.
- A randomized schedule time is assigned.
- The frontend queue now shows the real `scheduled_for` value instead of a hardcoded time.
- Queue pagination now works with `total_pages` metadata.
- Queue items can be edited from the dashboard and saved back to the backend.

### Reply handling

- A dedicated reply worker has been added.
- Reply inbox processing is now separated from outreach sending.
- Normal replies are marked as `replied`.
- Opt-out phrases are detected and the user is added to the block list.
- Reply/opt-out activity is logged.

### Dashboard updates

- Outreach queue panel now uses real pagination.
- Next button is disabled at the last page.
- Queue drawer can edit and save the outreach content.
- A manual `Process Replies` button is available in the top action bar.

### API work completed

- `GET /outreach/queue?page=&limit=` now returns pagination metadata.
- `PUT /outreach/queue/{item_id}` updates outreach message content.
- `POST /outreach/trigger-reply` triggers the reply worker manually.

## Current Worker Flow

1. Monitor worker discovers and scores posts.
2. Outreach worker queues qualified leads and sends scheduled DMs.
3. Reply worker checks inbox replies and opt-outs.
4. Dashboard reads the queue and lets the user edit content before sending.

## Important Implementation Notes

- Each worker uses its own lock file to prevent duplicate execution of that worker.
- The reply worker was intentionally split out of the outreach worker to reduce responsibility overlap.
- Opt-out handling also updates the blocked user table.
- The queue save action now updates actual outreach content in the database rather than only changing local UI state.

## Known Follow-Up Work

- improve shared locking between outreach and reply workers
- add atomic claim logic for queue items to avoid race conditions across workers
- expand reply parsing for richer inbox scenarios
- expose a dedicated replies/status panel in the dashboard
- document compliance and production migration in a separate phase 2 note

## Current Build Summary

The project is no longer only a skeleton. The current build includes:

- lead discovery
- AI scoring
- queue creation
- randomized scheduling
- queue editing
- reply detection
- opt-out blocking
- audit logging
- dashboard controls for core worker actions
