# FlyRank Lead Capture Platform

A simple embeddable lead-capture widget platform built with Node.js, Express and PostgreSQL.

## Features

* User signup and login with JWT authentication
* Authenticated widget CRUD API
* Tenant-isolated widgets and submissions
* Public embeddable widget
* Public submission API
* JSON validation and clean 4xx errors
* Honeypot spam protection
* IP-based rate limiting
* Geo enrichment with Provider A → Provider B fallback
* Submission side effect after storage
* Dashboard submission statistics
* PostgreSQL persistence
* Docker-based PostgreSQL setup

## Tech Stack

* Node.js
* Express.js
* PostgreSQL
* JWT
* Docker
* HTML/CSS/JavaScript

## Project Structure

```text
flyrank-capstone-widget-platform/
│
├── config/
├── controllers/
├── db/
├── middleware/
├── public/
├── routes/
├── services/
├── .env.example
├── .gitignore
├── BUILDLOG.md
├── EVIDENCE.md
├── README.md
├── capstone.yaml
├── package.json
└── server.js
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a `.env` file:

```env
PORT=3000
DATABASE_URL=postgresql://flyrank:flyrank@localhost:5433/flyrank
JWT_SECRET=change-this-secret
SIDE_EFFECT_MODE=normal
```

Do not commit `.env`.

### 3. Start PostgreSQL

```bash
docker compose up -d
```

### 4. Initialize database

```bash
npm run db:init
```

### 5. Start server

```bash
node server.js
```

Server:

```text
http://localhost:3000
```

## Main API Endpoints

### Authentication

```text
POST /auth/signup
POST /auth/login
```

### Widgets

```text
GET    /api/widgets
GET    /api/widgets/:id
POST   /api/widgets
PUT    /api/widgets/:id
DELETE /api/widgets/:id
```

### Public Widget

```text
GET /widgets/:id
```

### Public Submissions

```text
POST /submissions
```

### Dashboard

```text
GET /dashboard/submissions
GET /dashboard/stats
```

### Health

```text
GET /health/db
```

## Embedding

The widget can be loaded from a customer page using the generated widget script.

Example:

```html
<div id="flyrank-widget"></div>

<script
  src="http://localhost:3000/widget.js"
  data-widget-id="YOUR_WIDGET_ID"
  data-api-base-url="http://localhost:3000">
</script>
```

## Abuse Protection

Submissions use IP-based rate limiting.

The current configuration allows a limited number of requests per minute and returns HTTP `429` when the limit is exceeded.

A hidden honeypot field is also used to reject simple automated spam submissions.

## Geo Enrichment

The submission flow attempts:

```text
Provider A
     ↓ failure
Provider B
     ↓ failure
Store submission without geo
```

A geo failure does not prevent a valid submission from being stored.

## Side Effects

After a submission is stored, a side effect is triggered asynchronously.

The side effect is intentionally simple for this capstone and logs information to the server console.

If the side effect fails, the submission has already been stored and the API still returns success.

## Dashboard

Authenticated users can view:

* Total submissions
* Submissions per widget
* Country/city breakdown
* Individual submissions

All dashboard queries are filtered by the authenticated user's ID.

## Testing

The implementation was tested for:

* Valid submission
* Malformed submission
* Honeypot spam
* Rate limiting
* Side-effect failure
* Dashboard statistics
* Database persistence
* JWT protected routes

## Non-goal

This capstone does not attempt to provide a production-grade email delivery system, advanced analytics platform, or complex frontend dashboard.

The focus is a small working lead-capture platform demonstrating the required backend architecture and evaluator probes.

```
```
