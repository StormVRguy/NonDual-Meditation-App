-- =========================================================================
-- How to add a new authenticable user
-- =========================================================================

-- In the previous step, we changed the login authentication to rely only
-- on the personal code. However, the original database design REQUIRED 
-- an email for each user.

-- FIRST: If you haven't already, you need to make the email optional
-- in your database. You can run the following two commands ONCE 
-- to remove the email requirement constraints:

ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

-- -------------------------------------------------------------------------
-- SECOND: Adding the user
-- -------------------------------------------------------------------------
-- To add a new user that can log in to the website, you simply need to 
-- insert a row into the 'users' table with their personal code.
-- The email field can be set to NULL or completely omitted.

-- Replace 'YOUR_CHOSEN_CODE_HERE' with the actual code you want to give 
-- to the user (e.g., 'MEDITATION-2026', 'JOHNDOE-55', etc.).

INSERT INTO users (personal_code)
VALUES ('YOUR_CHOSEN_CODE_HERE');

-- They will then be able to go to the website and log in using just 
-- that personal code.

-- Note: The 'id' (UUID) and 'created_at' timestamps are generated 
-- automatically by Supabase.
