-- Create lecture_files table to store video lecture files
-- Similar structure to meditation_files but for videos

CREATE TABLE IF NOT EXISTS lecture_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE UNIQUE NOT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_lecture_files_date ON lecture_files(date);
CREATE INDEX IF NOT EXISTS idx_lecture_files_created_at ON lecture_files(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE lecture_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Lecture files: Public read access (for video playback)
CREATE POLICY "Anyone can read lecture files" ON lecture_files
    FOR SELECT USING (true);

-- Service role can manage lecture files
CREATE POLICY "Service role can manage lecture files" ON lecture_files
    FOR ALL USING (auth.role() = 'service_role');
