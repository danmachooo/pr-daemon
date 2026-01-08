# pr-daemon

**Rule-based PR accountability for teams that value signal over noise.**

pr-daemon is a lightweight daemon that monitors GitHub pull requests and alerts teams **only when workflow standards are violated** — not on every event.

Instead of flooding Slack with PR activity, pr-daemon encodes **opinionated review rules** (ownership, timeliness, and progress) and stays silent unless intervention is required.

---

## Why pr-daemon?

Most GitHub–Slack integrations:

* Forward *every* event
* Create alert fatigue
* Lack ownership enforcement
* Provide no opinion on what “healthy” looks like

**pr-daemon is different.**

It answers one question:

> *“Is this PR progressing the way our team expects?”*

If yes → silence
If no → a single, actionable alert

---

## Core Principles

* **Signal over noise** — alerts fire once per violation
* **Opinionated rules** — encode workflow standards, not events
* **Ownership matters** — PRs must have a responsible reviewer
* **Set and forget** — minimal setup, minimal UI
* **Stateless UI, stateful backend** — correctness over dashboards

---

## What pr-daemon Detects (Phase 1–4)

pr-daemon continuously evaluates pull requests using persisted state and rule timestamps.

### ✅ Implemented Rules

#### 1. Stale PRs

Alerts when a PR has no activity beyond a configurable threshold.

> *“This PR hasn’t moved in X hours — is it blocked?”*

---

#### 2. Unreviewed PRs

Alerts when a PR has no reviews within the expected review window.

> *“This PR is waiting for review longer than expected.”*

---

#### 3. Reviewed but Stalled PRs

Alerts when reviews exist, but the PR is no longer progressing.

> *“Reviews are in, but no action is happening.”*

---

### Ownership & Review Tracking

Each PR tracks:

* Requested reviewers
* Completed reviewers
* Pending reviewers

This enables pr-daemon to:

* Detect missing ownership
* Identify stalled reviews
* Show *who* is responsible without tagging spam

---

## Alert Behavior (Important)

pr-daemon **never spams**.

Each rule has a corresponding alert timestamp:

* `staleAlertAt`
* `unreviewedAlertAt`
* `stalledAlertAt`

An alert is sent **only if the alert timestamp is `null`**.
Once fired, pr-daemon stays quiet unless the PR transitions into a new violation state.

This guarantees:

* One alert per violation
* No repeated reminders
* High trust in alerts

---

## Example Slack Alert

#### 🧟‍♂️ Example: Stale Pull Request Alert

```
​🚨 Stale Pull Request Detected
< Pull Request | #42 – Fix race condition in webhook handler>
> Repo: pr-daemon-api
> Opened: 12/28/2025 (5 days ago)

```
#### 👀 Example: Unreviewed Pull Request Alert
```
👀 PR Needs Review
< Pull Request | #57 – Add Slack retry logic>
> Repo: pr-daemon-api
> Current Reviewers: @alice, @bob
> Status: Awaiting first review
```
#### If no reviewers are assigned:
```
👀 PR Needs Review
< Pull Request | #61 – Update README onboarding>
> Repo: pr-daemon-api
> Current Reviewers: _None assigned_
> Status: Awaiting first review
```
#### 🚧 Example: Stalled Pull Request Alert
```
🚧 PR is Stalled
< Pull Request | #33 – Refactor alert scheduler>
> Repo: pr-daemon-api
> Last Activity: 18 hours ago by *charlie*
> Pending Reviewers: @alice, @bob
> Action: Please check if a follow-up is needed.
```
#### If no one has reviewed it yet:
```
🚧 PR is Stalled
< Pull Request | #34 – Initial Redis integration>
> Repo: pr-daemon-api
> Last Activity: No one has reviewed this PR yet.
> Pending Reviewers: @alice
> Action: Please check if a follow-up is needed.
```

Clear. Actionable. No noise.

---

## How It Works

1. GitHub sends webhook events (PR opened, reviewed, updated)
2. pr-daemon ingests and normalizes events
3. PR state is persisted (reviews, reviewers, timestamps)
4. Rules are evaluated continuously
5. Alerts fire **only when a rule is violated**

---

## Setup (Current)

1. Deploy pr-daemon
2. Configure Slack Incoming Webhook
3. Register GitHub Webhook (PR + Review events)
4. Adjust rule thresholds via config

No UI required to get value.

---

## Configuration

All rule thresholds are centralized and versioned in a config layer:

* Stale PR threshold
* Review wait time
* Stall detection window

This avoids premature auth/UI complexity while keeping behavior explicit and predictable.

---

## Roadmap

### Phase 5 (Planned)

* Hosted web app
* OAuth (GitHub / Google)
* Team onboarding flow
* UI-based threshold configuration
* Multi-team support

### Phase 6 (Optional)

* Per-repo rules
* Alert history
* Audit trail
* Read-only dashboards

---

## Who This Is For

pr-daemon is ideal for:

* Startup teams
* Remote teams
* Junior-heavy teams
* Engineering managers
* Founders who want accountability without micromanagement

It is **not** for teams that want:

* Every PR event
* Dashboards for everything
* Heavy process tooling

---

## Tech Stack

* Node.js + TypeScript
* Express
* PostgreSQL (Neon)
* GitHub Webhooks
* Slack Incoming Webhooks

Designed as an **event-driven, stateful backend service**.

---

## Why This Project Exists

pr-daemon was built to:

* Solve a real workflow problem
* Avoid alert fatigue
* Demonstrate production-grade backend thinking
* Serve as a foundation for a focused, paid utility

This is not a growth-hack SaaS.
It’s a tool that earns its place by staying quiet.

---

## License

MIT

---

