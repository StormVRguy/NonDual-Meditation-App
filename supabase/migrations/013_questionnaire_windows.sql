-- Questionnaire windows: configurable time intervals (timestamptz) in which the questionnaire can be opened.
-- Enforced server-side via Edge Functions; rows are managed by service role only.

-- Windows definition table
CREATE TABLE IF NOT EXISTS questionnaire_windows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT questionnaire_windows_valid_range CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_questionnaire_windows_enabled_starts_ends
  ON questionnaire_windows (enabled, starts_at, ends_at);

-- One open per user per window
CREATE TABLE IF NOT EXISTS questionnaire_window_opens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  window_id UUID NOT NULL REFERENCES questionnaire_windows(id) ON DELETE CASCADE,
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT questionnaire_window_opens_unique_user_window UNIQUE (user_id, window_id)
);

CREATE INDEX IF NOT EXISTS idx_questionnaire_window_opens_user_window
  ON questionnaire_window_opens (user_id, window_id);

-- RLS
ALTER TABLE questionnaire_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_window_opens ENABLE ROW LEVEL SECURITY;

-- Service role can manage all rows (Edge Functions)
CREATE POLICY "Service role can manage questionnaire windows" ON questionnaire_windows
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage questionnaire window opens" ON questionnaire_window_opens
  FOR ALL USING (auth.role() = 'service_role');

