-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    personal_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily logs table
CREATE TABLE daily_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    meditation_played BOOLEAN DEFAULT FALSE,
    meditation_started_at TIMESTAMP WITH TIME ZONE,
    questionnaire_started_at TIMESTAMP WITH TIME ZONE,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Meditation files table
CREATE TABLE meditation_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE UNIQUE NOT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_daily_logs_user_id ON daily_logs(user_id);
CREATE INDEX idx_daily_logs_date ON daily_logs(date);
CREATE INDEX idx_meditation_files_date ON meditation_files(date);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meditation_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users: Only service role can read/write (for Edge Functions)
CREATE POLICY "Service role can manage users" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- Daily logs: Users can only see their own logs (if needed for future features)
CREATE POLICY "Users can view their own logs" ON daily_logs
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Service role can manage all logs (for Edge Functions)
CREATE POLICY "Service role can manage logs" ON daily_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Meditation files: Public read access (for audio playback)
CREATE POLICY "Anyone can read meditation files" ON meditation_files
    FOR SELECT USING (true);

-- Service role can manage meditation files
CREATE POLICY "Service role can manage meditation files" ON meditation_files
    FOR ALL USING (auth.role() = 'service_role');
