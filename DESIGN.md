# FlyRank Widget Platform — Design Document

## 1. Problem

The platform allows customers to create embeddable lead-capture widgets and place them on external websites using a single script tag.

Visitors can submit their information through the widget. The backend validates, protects, enriches, and stores the submission so the widget owner can view leads and basic analytics.

## 2. Main Actors

### Widget Owner
Authenticated user who creates and manages widgets and views submissions.

### Website Visitor
Unauthenticated visitor who interacts with an embedded widget and submits a lead.

## 3. Main Data Model

### User
- id
- email
- password_hash
- created_at

### Widget
- id
- user_id
- type
- title
- description
- fields
- button_text
- display_options
- created_at
- updated_at

### Submission
- id
- widget_id
- user_id
- form_data
- ip_address
- country
- city
- created_at

Every widget belongs to one user, and every submission belongs to one widget and its owner.

## 4. Tenant Isolation

Each authenticated user is treated as a tenant.

All widget and submission queries will be restricted using the authenticated user's ID.

A user must never be able to read, update, delete, or access another user's widgets or submissions.

## 5. Main API Surface

### Authentication
- POST /auth/signup
- POST /auth/login
- POST /auth/logout

### Widget Management
- POST /api/widgets
- GET /api/widgets
- GET /api/widgets/:id
- PUT /api/widgets/:id
- DELETE /api/widgets/:id

### Public Widget
- GET /widgets/:id/config
- GET /widget.js

### Public Submission
- POST /submissions

### Dashboard
- GET /api/dashboard/submissions
- GET /api/dashboard/stats

## 6. Widget Flow

1. Widget owner logs in.
2. Owner creates a widget.
3. API stores the widget configuration.
4. API generates an embed script.
5. Owner places the script on a website.
6. The script loads the widget configuration.
7. The widget renders a form.
8. Visitor submits the form.
9. Backend validates and protects the request.
10. Backend performs geo enrichment.
11. Submission is stored.
12. A non-critical email/webhook side effect is triggered.
13. Owner can view the submission through the dashboard.

## 7. Submission Protection

The public submission endpoint will use:

- CORS
- Boundary validation
- Payload size limits
- Rate limiting
- Honeypot spam protection
- Proper HTTP status codes

Invalid requests will return 4xx responses instead of causing server errors.

## 8. Geo Enrichment

The backend will attempt IP geolocation using:

1. Provider A
2. Provider B if Provider A fails
3. No geo data if both providers fail

A geo provider failure must never prevent a valid submission from being stored.

## 9. Safe Side Effects

After storing a submission, the platform will trigger a confirmation notification/email simulation.

If this secondary operation fails, the submission will remain stored and the API will still return success.

## 10. Non-Goal

This project will not build a full drag-and-drop form builder or production frontend dashboard.

The focus is backend correctness, security, resilience, widget delivery, lead capture, and API behavior.

## 11. Architecture

```text
Widget Owner
    |
    v
Authenticated API
    |
    v
Widget Database
    |
    v
Embed Script
    |
    v
External Website
    |
    v
Public Widget
    |
    v
Submission API
    |
    +--> Validation
    +--> CORS
    +--> Rate Limit
    +--> Spam Protection
    +--> Geo A -> Geo B -> No Geo
    |
    v
PostgreSQL
    |
    +--> Dashboard
    |
    +--> Notification/Webhook