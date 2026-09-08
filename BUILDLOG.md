# Build Log

## Phase 1 — Project Setup

* Created dedicated FlyRank capstone repository.
* Initialized Node.js project.
* Installed Express, PostgreSQL client and required dependencies.
* Added environment configuration.
* Added Git repository and remote.

## Phase 2 — Database

* Added PostgreSQL using Docker.
* Created `users` table.
* Created `widgets` table.
* Created `submissions` table.
* Added database indexes.
* Added database initialization script.
* Verified database connectivity.

## Phase 3 — Authentication

* Implemented signup.
* Implemented login.
* Added JWT authentication.
* Added protected routes.
* Verified authenticated access.

## Phase 4 — Widget Management

* Implemented authenticated widget CRUD.
* Added tenant ownership using `user_id`.
* Added public widget delivery.
* Added embeddable widget JavaScript.

## Phase 5 — Submission System

* Added public submission endpoint.
* Added request validation.
* Added malformed input handling.
* Added PostgreSQL persistence.
* Added public cross-origin submission support.
* Added honeypot spam protection.

## Phase 6 — Abuse Protection

* Added IP-based submission rate limiting.
* Verified HTTP 429 response after exceeding the configured limit.

## Phase 7 — Geo Enrichment

Implemented provider fallback:

```text
Provider A → Provider B → no geo
```

Geo failures do not block submission storage.

## Phase 8 — Side Effect

* Added asynchronous submission side effect.
* Added test failure mode.
* Verified side-effect failure does not prevent successful submission.

## Phase 9 — Dashboard

Added authenticated dashboard endpoints:

```text
/dashboard/submissions
/dashboard/stats
```

Dashboard provides:

* total submissions
* per-widget counts
* geo breakdown
* submission records

## Phase 10 — Evaluator Testing

Completed tests for:

* Valid submission
* Malformed submission
* Honeypot spam
* Rate limiting
* Side-effect failure
* Dashboard
* Database persistence
* Authentication

## Final Status

Core capstone functionality is implemented and tested.

The implementation intentionally keeps optional production-level features simple so that the required platform behavior remains easy to run and evaluate.
