-- Insert new lecture video
-- Replace YOUR_FILE_URL_HERE with the public URL from Supabase Storage

INSERT INTO lecture_files (date, file_url)
VALUES (
  CURRENT_DATE,  -- Today's date (or use a specific date like '2025-02-17')
  'YOUR_FILE_URL_HERE'  -- Replace with your actual file URL from Storage
)
ON CONFLICT (date) DO UPDATE
SET file_url = EXCLUDED.file_url,
    created_at = NOW();

-- Verify the insert
SELECT * FROM lecture_files ORDER BY created_at DESC LIMIT 1;
