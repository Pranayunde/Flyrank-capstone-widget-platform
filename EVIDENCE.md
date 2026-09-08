# Evaluator Evidence

## 1. Authentication

JWT authentication was implemented for protected routes.

Tested:

```text
POST /auth/signup
POST /auth/login
GET /protected/profile
```

A valid JWT allows access to protected routes.

## 2. Widget Management

Authenticated widget management API supports:

```text
POST   /api/widgets
GET    /api/widgets
GET    /api/widgets/:id
PUT    /api/widgets/:id
DELETE /api/widgets/:id
```

Widgets contain an owning `user_id`, providing tenant isolation.

## 3. Public Submission

A valid submission was successfully created through:

```text
POST /submissions
```

Example successful response:

```text
Submission received successfully
```

Submission data was persisted in PostgreSQL.

## 4. Malformed Submission

A submission with missing `form_data` was tested.

Observed response:

```json
{
  "error": "Form data is required"
}
```

The endpoint returned a 4xx response instead of HTTP 500.

## 5. Honeypot Spam Protection

A submission containing a non-empty honeypot field was tested.

Example:

```json
{
  "website": "https://spam.com"
}
```

Observed response:

```json
{
  "error": "Invalid submission"
}
```

This demonstrates basic spam protection.

## 6. Rate Limiting

Submission rate limiting was tested with a burst of requests.

Observed behavior:

```text
Requests 1-10 → accepted
Request 11 → HTTP 429
```

Observed error:

```json
{
  "error": "Too many submissions. Please try again later."
}
```

## 7. Geo Fallback

The geo service implements:

```text
Provider A
    ↓ failure
Provider B
    ↓ failure
No geo
```

If the first provider fails, the second provider is attempted.

If both providers fail, the submission continues with null geo fields.

Localhost requests use `::1` and intentionally skip external geo lookup.

## 8. Side Effect Failure

The side-effect service supports a failure test mode.

With:

```env
SIDE_EFFECT_MODE=fail
```

a submission was still successfully stored.

Observed API response:

```text
Submission received successfully
```

The server logs the side-effect failure separately.

This proves the side effect does not block successful submission storage.

## 9. Dashboard

Authenticated dashboard endpoints:

```text
GET /dashboard/submissions
GET /dashboard/stats
```

were tested successfully.

The database contained 15 submissions for the test user's ID, and the dashboard returned the user's submission data and statistics.

Dashboard data is filtered using the authenticated user's ID.

## 10. Database

PostgreSQL contains:

```text
users
widgets
submissions
```

Submissions store:

* widget ID
* user ID
* form data
* IP address
* country
* city
* created timestamp

## 11. Secrets

`.env` is excluded from Git.

`.env.example` contains placeholder configuration only.

No real secrets are intended to be committed to the repository.
