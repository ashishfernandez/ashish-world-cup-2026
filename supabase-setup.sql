-- Run in Supabase SQL Editor so all visitors can read/write the shared pool.
-- Required for global leaderboard, bracket, groups, and admin views.

-- Submissions: one row per locked participant pick
CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL
);

-- Official tournament results (admin simulator)
CREATE TABLE IF NOT EXISTS official_results (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL
);

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read submissions" ON submissions;
DROP POLICY IF EXISTS "Public insert submissions" ON submissions;
DROP POLICY IF EXISTS "Public update submissions" ON submissions;
DROP POLICY IF EXISTS "Public delete submissions" ON submissions;

CREATE POLICY "Public read submissions" ON submissions
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public insert submissions" ON submissions
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Public update submissions" ON submissions
    FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public delete submissions" ON submissions
    FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read official_results" ON official_results;
DROP POLICY IF EXISTS "Public insert official_results" ON official_results;
DROP POLICY IF EXISTS "Public update official_results" ON official_results;

CREATE POLICY "Public read official_results" ON official_results
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public insert official_results" ON official_results
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Public update official_results" ON official_results
    FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Realtime (Database → Replication) — enable for: submissions, official_results
