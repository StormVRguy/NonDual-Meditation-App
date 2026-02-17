-- Example: Insert a lecture file into lecture_files table
-- Replace the values below with your actual file URL and date

-- Option 1: Insert with today's date
INSERT INTO lecture_files (date, file_url)
VALUES (
  CURRENT_DATE,  -- Today's date
  'https://YOUR_PROJECT_ID.supabase.co/storage/v1/object/public/lectures/YOUR_FILENAME.mp4'
)
ON CONFLICT (date) DO UPDATE
SET file_url = EXCLUDED.file_url,
    created_at = NOW();

-- Option 2: Insert with a specific date
-- INSERT INTO lecture_files (date, file_url)
-- VALUES (
--   '2025-02-17',  -- Specific date (YYYY-MM-DD format)
--   'https://YOUR_PROJECT_ID.supabase.co/storage/v1/object/public/lectures/YOUR_FILENAME.mp4'
-- )
-- ON CONFLICT (date) DO UPDATE
-- SET file_url = EXCLUDED.file_url,
--     created_at = NOW();

-- Note: The ON CONFLICT clause ensures that if a lecture for that date already exists,
-- it will update the file_url instead of failing. This is useful if you need to replace a video.
