## PR-daemon

**PR-daemon is a lightweight tool that helps small engineering teams surface workflow issues earlier using rule-based Slack alerts — without notification spam.**

## Instead of flooding Slack with GitHub events, PR-daemon encodes workflow standards (e.g. “PRs shouldn’t stay open too long”) and only alerts when those standards are violated.

## Why I Built This

Small teams don’t lack tools — they lack **signal**.

Most GitHub–Slack integrations:

- forward every event
- create alert fatigue
- require humans to interpret noise

PR-daemon takes a different approach:

> _If nothing is wrong, it stays silent._

This project explores how to build **event-driven systems**, **time-based rules**, and **non-spammy alerting** — the kind of problems real SaaS products face.

---

## Core MVP Feature

### 🚨 Stale Pull Request Detection

OpsCopilot detects pull requests that remain open longer than an acceptable threshold and sends a **single actionable Slack alert**.

- No dashboards to monitor
- No repeated alerts
- Automatic reset when PRs are closed

---

## How It Works (High Level)

```
GitHub Webhook
   ↓
Event Ingestion (Express)
   ↓
Persistent State (Prisma + DB)
   ↓
Background Rule Evaluation (Cron)
   ↓
Deduplicated Slack Alerts
```

---

## Key Design Decisions

### 1. Rule-Based, Not Event-Based

Staleness is a **time-based problem**, so detection runs via scheduled jobs rather than real-time events.

### 2. Alert Deduplication by Design

Each stale PR can only trigger **one alert per incident**, enforced via database state.

### 3. Thin Webhook Handlers

Webhook endpoints only ingest and normalize data — business logic lives in services.

### 4. Backend-First Architecture

The backend is the product. The frontend exists only for configuration and visibility.

---

## Tech Stack

- **Backend:** Node.js, Express, TypeScript
- **Database:** Prisma ORM
- **Background Jobs:** node-cron
- **Integrations:** GitHub Webhooks, Slack Incoming Webhooks
- **Frontend (planned):** Next.js (for configuration UI)

---

## MVP Scope (Intentional)

### Included

- GitHub pull request webhooks
- Persistent PR state tracking
- Time-based stale detection
- Slack alerts with deduplication

### Excluded

- AI / analytics dashboards
- Productivity scoring
- Billing / auth
- Complex UI

This keeps the product focused and production-realistic.

---

## What This Project Demonstrates

- Event-driven backend design
- Idempotent webhook handling
- Rule-based business logic
- Background job orchestration
- Alert fatigue prevention
- SaaS-level architectural thinking

---

## Demo Scenario

1. A pull request is opened on GitHub
2. OpsCopilot stores the PR state
3. Time passes without merging
4. A background job detects the PR is stale
5. OpsCopilot sends **one Slack alert**
6. The PR is merged → alert state resets

---

## Status

**MVP complete.**
Future work includes configuration UI, multi-team support, and additional workflow rules.
