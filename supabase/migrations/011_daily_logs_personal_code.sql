-- Colonna denormalizzata: copia del personal_code dell'utente (users.personal_code) per report/export su daily_logs
ALTER TABLE daily_logs
ADD COLUMN IF NOT EXISTS personal_code TEXT;

CREATE INDEX IF NOT EXISTS idx_daily_logs_personal_code ON daily_logs(personal_code);

COMMENT ON COLUMN daily_logs.personal_code IS 'Copia del codice personale (users.personal_code) alla data del log; aggiornata dagli upsert delle Edge Functions.';

-- Aggiorna le righe già presenti
UPDATE daily_logs dl
SET personal_code = u.personal_code
FROM users u
WHERE dl.user_id = u.id
  AND (dl.personal_code IS NULL OR dl.personal_code = '');
