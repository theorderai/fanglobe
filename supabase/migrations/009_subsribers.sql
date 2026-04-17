-- Migration 009: Fan email subscribers
CREATE TABLE IF NOT EXISTS fan_subscribers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT UNIQUE NOT NULL,
  session_id   TEXT,
  city         TEXT,
  country      TEXT,
  flag         TEXT,
  city_rank    INT4,
  match_id     TEXT,
  sport_id     TEXT DEFAULT 'soccer',
  verified     BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  last_notified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_subscribers_email   ON fan_subscribers (email);
CREATE INDEX IF NOT EXISTS idx_subscribers_match   ON fan_subscribers (match_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_city    ON fan_subscribers (city);

ALTER TABLE fan_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_subscribers" ON fan_subscribers FOR ALL TO service_role USING (true);