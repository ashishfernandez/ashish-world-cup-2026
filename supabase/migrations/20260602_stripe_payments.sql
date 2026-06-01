-- Pending entries awaiting Stripe payment (promoted to submissions after checkout completes)

CREATE TABLE IF NOT EXISTS pending_submissions (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired')),
    stripe_session_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS pending_submissions_status_idx ON pending_submissions (status);
CREATE INDEX IF NOT EXISTS pending_submissions_stripe_session_idx ON pending_submissions (stripe_session_id);

ALTER TABLE pending_submissions ENABLE ROW LEVEL SECURITY;

-- No public policies: only service role (Edge Functions) reads/writes this table.
