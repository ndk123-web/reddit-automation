# AutoNova Pod 2 — Functional & Non-Functional Requirements

# Project Overview

Build an AI-powered Reddit outreach system that:

- monitors Reddit communities
- identifies potential business leads
- scores them using AI
- generates contextual outreach
- schedules messages safely
- tracks the outreach lifecycle
- exposes all activity through an admin dashboard

The project contains:

1. Automation Backend (AI Automation Interns)
2. Dashboard/Admin Panel (Web Dev Intern)

---

# 1. FUNCTIONAL REQUIREMENTS

(What the system MUST do)

# A. Reddit Monitoring & Lead Discovery

## A1. Subreddit Monitoring

The system must:

- monitor target subreddits continuously
- fetch new posts and top-level comments
- support multiple subreddits simultaneously

Examples:

- r/startups
- r/SaaS
- r/Entrepreneur
- r/smallbusiness

---

## A2. Dynamic Subreddit Configuration

Subreddit list must:

- NOT be hardcoded
- be editable without code changes
- support add/remove/pause functionality

Possible implementation:

- DB table
- JSON config
- dashboard settings

---

## A3. Keyword/Phrase Detection

The system must:

- scan posts/comments for configurable keywords
- support phrase matching
- allow keyword updates without redeployment

Examples:

- automation
- AI tool
- manual process
- lead generation
- workflow bottleneck

---

## A4. Lead Qualification

The system must:

- identify potential leads
- evaluate whether the user appears relevant to AutoNova

Possible indicators:

- founder/CEO language
- business pain points
- operational inefficiencies
- scaling problems

---

## A5. AI Lead Scoring

The system must:

- use an LLM/OpenRouter model
- score leads from 1–10
- include reasoning/context

Lead score based on:

- relevance
- urgency
- business intent
- authority level

---

## A6. Qualification Threshold

The system must:

- allow configurable score threshold
- move only qualified leads into outreach pipeline

Example:
score >= 7

---

## A7. De-Duplication

The system must:

- prevent repeated outreach to same user
- support configurable cooldown periods

Example:

- no contact again within 30 days

---

## A8. Lead Storage

The system must store:

- Reddit username
- subreddit
- post/comment URL
- extracted content
- lead score
- timestamps
- current status

Statuses:

- discovered
- qualified
- queued
- outreach_sent
- replied
- nurturing
- converted
- disqualified

---

# B. AI Personalization Engine

## B1. Personalized Message Generation

The system must:

- generate contextual DMs
- reference actual Reddit content
- avoid generic templates

---

## B2. Configurable Templates

The system must:

- support editable templates
- allow prompt customization
- inject AI personalization dynamically

---

## B3. Public Engagement Comment Generation

The system must:

- generate helpful public comments
- avoid promotional content
- simulate genuine engagement

---

## B4. AI Safety Checks

The system must:

- filter promotional wording
- avoid spam-like phrases
- avoid outbound links during public engagement

---

# C. Outreach & Sequencing

## C1. Outreach Queue

The system must:

- queue pending messages
- support scheduling before sending

---

## C2. Multi-Step Sequences

The system must support:

1. Initial outreach
2. Follow-up
3. Final close message

---

## C3. Configurable Delays

The system must:

- allow configurable follow-up intervals
- support variable/randomized delays

---

## C4. Human-like Scheduling

The system must:

- randomize message timing
- avoid bulk sending
- simulate natural behavior

---

## C5. Reply Detection

The system must:

- detect inbound replies
- stop automation immediately after reply

---

## C6. Human Handoff

The system must:

- flag replied leads
- require manual human continuation

---

## C7. Opt-Out Detection

The system must:

- detect phrases like:
  - stop
  - not interested
  - don't contact me
- permanently block future outreach

---

# D. Reddit Compliance & Ban Prevention

## D1. Official Reddit API Usage

The system must:

- use Reddit API/PRAW
- use OAuth authentication
- avoid scraping

---

## D2. Rate Limiting

The system must:

- respect Reddit limits
- implement internal safety margins

---

## D3. Karma & Account-Age Awareness

The system must:

- research subreddit/account requirements
- prevent outreach from unsafe/new accounts

---

## D4. Subreddit Rule Auditing

The system must:

- check subreddit rules
- disable outreach where solicitation prohibited

---

## D5. Shadowban Detection

The system must:

- periodically check account visibility
- alert team on possible shadowban

---

## D6. Proper User-Agent

The system must:

- use Reddit-compliant user-agent format

Example:
linux:autonova-bot:v1.0 (by u/username)

---

# E. Tracking & Analytics

## E1. Event Tracking

Track:

- lead discovered
- scored
- queued
- message sent
- reply received
- converted
- opted-out

---

## E2. Audit Logging

The system must log:

- all outbound messages
- timestamps
- errors
- account events
- moderation events

---

## E3. Analytics

The system must track:

- outreach volume
- reply rate
- subreddit performance
- conversion metrics

---

# F. Dashboard Requirements

# F1. Pipeline Overview

Dashboard must display:

- discovered leads
- qualified leads
- replied leads
- converted leads

---

## F2. Lead Detail View

The dashboard must show:

- username
- subreddit
- message history
- lead score
- timestamps
- next scheduled action

---

## F3. Subreddit Management

Dashboard must allow:

- add/remove subreddit
- pause/resume monitoring

---

## F4. Keyword Management

Dashboard must allow:

- add/edit/delete keywords

---

## F5. Outreach Queue View

Dashboard must:

- show queued messages
- allow approve/edit/cancel

---

## F6. Template Editor

Dashboard must:

- edit AI prompts
- edit DM templates

---

## F7. Do-Not-Contact List

Dashboard must:

- view blocked users
- manually add/remove users

---

## F8. Account Health Panel

Dashboard must display:

- karma
- account age
- API status
- rate-limit status
- shadowban alerts

---

## F9. Audit Log Viewer

Dashboard must:

- provide searchable logs
- support event filtering

---

# 2. NON-FUNCTIONAL REQUIREMENTS

(How the system should behave)

# A. Reliability & Stability

## A1. No Reddit Ban

MOST CRITICAL REQUIREMENT.

The system must:

- avoid bans
- avoid shadowbans
- avoid spam detection

---

## A2. Stable Runtime

The system should:

- avoid crashes
- recover gracefully from failures

---

## A3. Error Handling

The system must:

- log failures
- handle API outages safely
- retry safely where needed

---

# B. Performance & Scalability

## B1. Efficient API Usage

The system must:

- minimize unnecessary requests
- optimize Reddit API usage

---

## B2. Scalable Design

Architecture should:

- support future scaling
- allow additional subreddits/leads

---

## B3. Fast Dashboard Response

Dashboard should:

- load quickly
- handle empty/loading states properly

---

# C. Security & Compliance

## C1. OAuth Security

Credentials must:

- remain private
- not be hardcoded in repo

---

## C2. Proper API Compliance

The system must:

- respect Reddit API policies
- use correct headers/user-agent

---

## C3. Safe Outreach

Messages should:

- avoid spam patterns
- avoid manipulative wording

---

# D. Maintainability

## D1. Modular Architecture

Codebase should:

- separate components logically
- support future changes

---

## D2. Clean Code

Code should:

- be readable
- documented
- consistently structured

---

## D3. Configurability

The system should:

- avoid hardcoded logic
- support dynamic settings

---

# E. Team & Workflow Requirements

## E1. Shared Repository

All code must:

- live in one repo
- use structured folders

Example:

- /automation
- /dashboard
- /docs

---

## E2. Internal Collaboration

Team must:

- align before coding
- review each other's work

---

## E3. Documentation

Project must include:

- README
- setup instructions
- architecture explanation
- API documentation

---

# F. UX/UI Requirements

## F1. Professional Dashboard

Dashboard must:

- avoid generic AI-generated look
- feel intentional/polished

---

## F2. Usability

Dashboard should:

- provide clear workflows
- minimize confusion

---

## F3. Responsive Design

Dashboard should:

- work on different screen sizes

---

# G. Delivery Requirements

## G1. Phase 1 Timeline

Working demo required within:

- 7 calendar days

---

## G2. Demo Readiness

Phase 1 must:

- run locally
- demonstrate complete flow

---

## G3. Production Research

Phase 2 must include:

- scaling research
- infrastructure planning
- cost estimation
- deployment recommendations

