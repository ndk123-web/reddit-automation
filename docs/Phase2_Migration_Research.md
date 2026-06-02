# Phase 2 Production Migration Research

Date: 2026-06-02
Owner: AutoNova Pod 2 (Automation + Web)
Scope: Production migration plan for Reddit outreach system after Phase 1

## 1. Executive Summary

This document defines how to migrate the current local prototype to a production-safe, policy-compliant system for continuous Reddit lead discovery and DM outreach.

Target monthly workload used for estimation:

- Monitored subreddits: 10
- Qualified leads: 200 / month
- Outbound DMs: 400 / month

Primary recommendation:

- Keep Reddit integration on official OAuth Data API (PRAW/HTTP), no scraping for production workflows.
- Run production on managed Postgres + managed app hosting (Railway or Render) with strict guardrails.
- Use a low-cost model for qualification and first-pass personalization, with fallback to higher-quality model only for borderline leads.
- Keep one primary outreach account + one warm backup account (not multi-account blasting).

## 2. Current Phase 1 Status Snapshot

Implemented in current codebase:

- Monitor worker with lock protection and sequential subreddit fetch.
- AI-based scoring of discovered posts.
- Outreach queue + randomized scheduling window.
- Reply worker with inbox processing, replied/opt-out state handling, and block list support.
- Manual triggers for monitor/reply workers.
- Analytics routes including account health endpoint with OAuth-aware fallback behavior.
- Dashboard integration with API-driven account health and connection status.

Important observation before production:

- Scheduler currently has outreach/reply jobs commented out in [automation/main_scheduler.py](../automation/main_scheduler.py). Re-enable after concurrency and rate-limit guardrails are finalized.

## 3. Reddit API Access at Scale

## 3.1 Policy and access model

Reddit policy direction (commercial use):

- Commercial usage requires explicit permission/contract path.
- Rate limits exist and may vary by endpoint/app approval.
- Production deployment must go through approved commercial pathway.

References to verify during onboarding:

- <https://support.reddithelp.com/hc/en-us/articles/14945211791892-Developer-Platform-Accessing-Reddit-Data>
- <https://support.reddithelp.com/hc/en-us/articles/16160319875092-Reddit-Data-API-Wiki>
- <https://developers.reddit.com/docs/>

## 3.2 Request volume estimate

Assumptions:

- Monitor cycle every 2 min.
- 10 subreddit reads each cycle.
- Additional reads/writes for inbox, send, health checks, retries.

Estimated monthly calls:

- Monitor reads: 10 *(60/2)* 24 * 30 = 216,000
- Replies + health + misc buffer: 40,000
- Total planned API calls: ~256,000 / month

Engineering safety target:

- Keep sustained rate below 30 requests/min average.
- Keep burst limit below 60 requests/min.
- Add token-bucket limiter and endpoint-specific cooldowns.

## 3.3 Cost planning model for Reddit API

Because Reddit commercial terms are contract-led and variable by use-case, budget using two layers:

- Contract baseline: negotiated enterprise/commercial access fee.
- Variable call budget: use historical planning proxy of $0.24 per 1,000 calls for sensitivity modeling only.

Sensitivity using 256k calls/month:

- At $0.24 / 1k calls -> ~$61.44/month
- At $0.50 / 1k calls -> ~$128.00/month
- At $1.00 / 1k calls -> ~$256.00/month

Decision note:

- Keep Reddit API as "contract + variable" line item in finance sheet until official quote is locked.

## 4. Official API vs Alternatives

## 4.1 Official Reddit Data API (recommended)

Use for:

- Discovery reads
- Account-authenticated writes (DM/comments)
- Inbox handling

Pros:

- Policy compliant
- Supports write operations and account context
- Stable long-term option

Cons:

- Commercial approval overhead
- Potential variable pricing/contracts

## 4.2 Pushshift / third-party aggregators (limited role)

Use only for:

- Supplemental historical research signals (if policy-allowed)

Do not use for:

- Outreach writes
- Inbox handling
- Primary production source-of-truth

Risk:

- Coverage/availability/policy drift
- Not suitable as primary outreach backbone

## 5. Production Account Strategy

Recommended strategy:

- 1 primary outreach account (aged, reputation maintained).
- 1 warm standby account for continuity (not simultaneous mass outreach).
- 1 internal brand account for non-automated community presence and trust.

Why not many outreach accounts:

- Multi-account automation looks adversarial and raises abuse signals.
- Reputation and subreddit trust matter more than raw send volume.

Karma and trust program (first 3-4 weeks):

- Daily non-promotional community comments.
- Niche subreddit participation before DM-heavy cadence.
- Gradual DM ramp-up with hard caps.

Recommended DM ramp:

- Week 1: 5-10/day
- Week 2: 10-20/day
- Week 3+: 20-35/day only if reply/ban metrics remain healthy

Hard stops:

- Any shadowban signal
- Spike in failures or blocked sends
- Opt-out rate crossing configured threshold

## 6. LLM Cost Optimization

Objective:

- Minimize cost per 1,000 personalized messages while preserving quality.

Token assumptions per message:

- Prompt input: 350 tokens
- Output: 120 tokens

Per 1,000 messages total tokens:

- Input: 350,000
- Output: 120,000

Indicative model pricing (verify at procurement time):

- GPT-4o-mini: low-cost/high-throughput baseline
- Claude Haiku: moderate cost, high quality/consistency
- Mistral small-tier model: low-cost, good for first pass

Estimated cost per 1,000 personalized messages (planning band):

- GPT-4o-mini: ~$0.15 to ~$0.35
- Claude Haiku: ~$0.70 to ~$1.50
- Mistral small-tier: ~$0.25 to ~$0.80

Recommendation:

- Two-stage routing:
  - Stage A (default): Mistral small-tier or GPT-4o-mini for all drafts.
  - Stage B (escalation): Claude Haiku only for borderline/high-value leads.

Quality guardrails:

- Safety filter before queueing (no links/promotional CTA in public comments).
- Template + slot personalization (title/problem/subreddit context).
- Human approval path for high-risk messages.

## 7. Database and Hosting Recommendation

## 7.1 Database choice

Recommended: Managed Postgres (Supabase Pro or Render Postgres)

Why:

- Better concurrency and reliability than SQLite for workers.
- Better migration/versioning and backup controls.
- Easier analytics/querying at scale.

## 7.2 Hosting choices

Option A: Railway (recommended for fastest ops)

- Strong developer velocity, usage-based billing, simple worker deployment.
- Good fit for Python workers + API + cron.

Option B: Render (recommended for predictable service plans)

- Clear service plans and managed Postgres options.
- Good fit for split web/api/worker services.

Option C: VPS (Hetzner/DigitalOcean)

- Lowest raw infra cost, highest operational burden.
- Better only if team can own patching, backups, observability, incident response.

## 7.3 Recommended production topology

Services:

- api-service: FastAPI backend
- monitor-worker: periodic discovery/scoring
- outreach-worker: queue + send
- reply-worker: inbox processing
- frontend-service: React app (static hosting/CDN)
- postgres: managed production DB
- redis (optional): distributed locks and queue claim safety

Minimum reliability controls:

- Centralized logs + error alerts
- Health checks for each worker
- Dead-letter handling for failed outreach attempts
- DB backup policy with weekly restore test

## 8. Estimated Monthly Cost (Target: 10 subs, 200 qualified, 400 DMs)

## 8.1 Baseline stack estimate (recommended)

Infrastructure:

- Railway Hobby/Pro floor or Render Pro workspace: $20-$35
- API service compute: $7-$25
- Worker compute (3 workers combined): $10-$30
- Managed Postgres: $10-$25
- Optional Redis: $0-$10

Platform subtotal:

- ~$47-$125 / month

AI subtotal:

- Qualification + personalization mixed routing:
- ~$8-$35 / month (depends on model and retries)

Reddit API subtotal:

- Contract + variable usage:
- planning band ~$60-$260 / month until quote finalized

Total monthly estimate (practical planning band):

- Low: ~$115 / month
- Mid: ~$220 / month
- High (buffered): ~$420 / month

## 8.2 Budget note for leadership

Use $250/month as planning baseline for initial production pilot, with 40% contingency cap up to $350 while tuning model routing and API behavior.

## 9. Migration Plan (Execution)

Phase 2 rollout steps:

1. Move SQLite -> Postgres with Alembic migration scripts.
2. Add distributed lock/claim strategy for outreach rows.
3. Re-enable all scheduler jobs after concurrency tests.
4. Add per-endpoint rate limiter + global budget manager.
5. Add safety policy gateway before all outbound actions.
6. Add alerts for shadowban, send-failure spikes, opt-out spikes.
7. Run 7-day canary with capped send volume.
8. Increase volume gradually with weekly policy review.

Exit criteria for full production:

- Zero shadowban incidents in canary window.
- Reply and opt-out metrics within agreed thresholds.
- No duplicate sends and no queue race conditions.
- Recovery drill passed (DB restore + worker restart).

## 10. Risk Register and Mitigation

Top risks:

- Reddit policy or access changes.
- Account trust degradation from aggressive outreach.
- Queue race conditions across workers.
- Model output drift (unsafe/promotional phrasing).

Mitigations:

- Contract-backed API access and periodic compliance review.
- Conservative send caps with automatic circuit breakers.
- Atomic DB claim updates + lock TTLs.
- Pre-send safety lint + manual approval mode for high-risk messages.

## 11. Open Decisions Required

Before final production launch, AutoNova must finalize:

- Official Reddit commercial access contract type.
- Approved subreddit allowlist and disallow rules.
- Account ownership policy (brand vs outreach accounts).
- Final model routing policy and monthly spend cap.
- Hosting provider preference (Railway vs Render).

## 12. Appendix: Quick Decision Matrix

| Area | Recommended | Reason |
|---|---|---|
| API access | Official Reddit Data API + contract | Compliance + long-term stability |
| DB | Managed Postgres | Concurrency + reliability |
| Hosting | Railway (speed) or Render (predictable plans) | Good operational balance |
| LLM routing | Cheap default + premium fallback | Best quality/cost control |
| Account strategy | 1 primary + 1 warm backup + 1 brand account | Reduces abuse signals |
| Send policy | Gradual ramp + hard stop triggers | Ban prevention first |

---

This document is designed to satisfy the Phase 2 deliverable requirements and can be exported to PDF directly.
