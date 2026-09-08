CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email VARCHAR(255)
        UNIQUE
        NOT NULL,

    password_hash TEXT
        NOT NULL,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW()
);


-- ============================================================
-- WIDGETS
-- ============================================================

CREATE TABLE IF NOT EXISTS widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID
        NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    type VARCHAR(50)
        NOT NULL
        DEFAULT 'lead_capture',

    title VARCHAR(255)
        NOT NULL,

    description TEXT,

    fields JSONB
        NOT NULL
        DEFAULT '[]'::jsonb,

    button_text VARCHAR(100)
        NOT NULL
        DEFAULT 'Submit',

    display_options JSONB
        NOT NULL
        DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW()
);


-- ============================================================
-- SUBMISSIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    widget_id UUID
        NOT NULL
        REFERENCES widgets(id)
        ON DELETE CASCADE,

    user_id UUID
        NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    form_data JSONB
        NOT NULL,

    ip_address INET,

    country VARCHAR(100),

    city VARCHAR(100),

    idempotency_key VARCHAR(255),

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW()
);


-- ============================================================
-- SAFE UPGRADE
-- ============================================================

ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS
idx_widgets_user_id
ON widgets(user_id);


CREATE INDEX IF NOT EXISTS
idx_submissions_widget_id
ON submissions(widget_id);


CREATE INDEX IF NOT EXISTS
idx_submissions_user_id
ON submissions(user_id);


CREATE INDEX IF NOT EXISTS
idx_submissions_created_at
ON submissions(created_at);


-- ============================================================
-- IDEMPOTENCY
-- ============================================================

-- Same idempotency key can be reused across different widgets,
-- but never twice for the same widget.

CREATE UNIQUE INDEX IF NOT EXISTS
idx_submissions_widget_idempotency
ON submissions(widget_id, idempotency_key)
WHERE idempotency_key IS NOT NULL;