# Meditation Training Website

A web-based meditation training application with simplified email+code authentication, daily meditation audio playback, Qualtrics questionnaire integration, activity logging, and automated email reminders.

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Supabase Edge Functions (Deno)
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage
- **Email**: Resend API
- **Hosting**: Vercel, **Netlify**, or Supabase Storage (static)

## Project Structure

```
/
├── frontend/              # React + Vite frontend application
│   ├── src/
│   │   ├── pages/        # Page components (Login, Dashboard)
│   │   ├── components/   # Reusable components (AudioPlayer)
│   │   ├── api/          # API client and helpers
│   │   └── App.jsx       # Main app component
│   └── .env.example      # Environment variables template
├── supabase/
│   ├── functions/        # Edge Functions
│   │   ├── auth-login/
│   │   ├── logs-meditation-start/
│   │   ├── logs-questionnaire-start/
│   │   ├── meditation-today/
│   │   └── send-reminders/
│   └── migrations/       # Database migrations
│       └── 001_initial.sql
├── netlify.toml          # Netlify: build from frontend/ (Vite), SPA redirects
├── SUPABASE_SETUP.md     # Detailed Supabase setup instructions
└── README.md             # This file
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Resend account (for email)

### Phase 1: Project Setup ✅

1. **Install frontend dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Set up Supabase**:
   - Follow the detailed instructions in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
   - This includes creating the project, running migrations, setting up storage, and configuring secrets

3. **Configure environment variables**:
   ```bash
   # Copy the example file to create your .env at the project root
   cp .env.example .env
   # Edit .env with your Supabase credentials and JWT_SECRET
   ```
   
   **Note**: The project uses a single `.env` file at the root. Vite is configured to read from it automatically.

4. **Run the development server**:
   ```bash
   cd frontend
   npm run dev
   ```

### Phase 2: Authentication ✅

1. **Deploy the auth-login Edge Function**:
   - Follow the detailed instructions in [PHASE2_DEPLOYMENT.md](./PHASE2_DEPLOYMENT.md)
   - This includes deploying the Edge Function, setting secrets, and testing authentication

2. **Seed test users**:
   - Add test users to your database using SQL Editor
   - See PHASE2_DEPLOYMENT.md for example SQL

3. **Test the login flow**:
   - Start the frontend: `cd frontend && npm run dev`
   - Navigate to the login page
   - Enter test user credentials
   - Verify successful login and redirect to dashboard

### Phase 3: Dashboard and Meditation Player ✅

1. **Deploy Edge Functions**:
   - Follow the detailed instructions in [PHASE3_DEPLOYMENT.md](./PHASE3_DEPLOYMENT.md)
   - Deploy `meditation-today` and `logs-meditation-start` functions

2. **Upload meditation files**:
   - Upload audio files to Supabase Storage
   - Add records to `meditation_files` table

3. **Test the dashboard**:
   - Login and verify the meditation player appears
   - Test audio playback and logging

### Next Phases

- **Phase 4**: Qualtrics integration
- **Phase 5**: Email reminder system
- **Phase 6**: Admin and content management

## Development

### Frontend Development

```bash
cd frontend
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Database Migrations

Run migrations through Supabase SQL Editor (see SUPABASE_SETUP.md) or using Supabase CLI:

```bash
supabase db push
```

### Edge Functions

Deploy Edge Functions using Supabase CLI:

```bash
supabase functions deploy <function-name>
```

## Deploying the frontend on Netlify

The repository root is **not** a static HTML site: it contains Supabase code, SQL, etc. The deployable app is **`frontend/`** (Vite + React). Netlify’s auto-detector often gets that wrong.

1. **Use the included `netlify.toml`** (commit and push it). It sets:
   - **Base directory**: `frontend`
   - **Build command**: `npm ci && npm run build`
   - **Publish directory**: `dist` (relative to `frontend`)
   - **SPA fallback** for React Router (`/*` → `index.html`)
2. In Netlify: **Add new site → Import from Git**, pick this repo. Netlify should read `netlify.toml` automatically.
3. **Site settings → Environment variables**: add the same `VITE_*` values as in your local `.env` (they are not in the repo).
4. If the build fails on `npm ci`, try changing the build command in Netlify UI to `npm install && npm run build`.

If Netlify still **does not list the GitHub repo**, that is a GitHub integration issue (org permissions, third-party access, or private repo access for the Netlify GitHub App)—not the TypeScript/HTML detection.

## Environment Variables

See `frontend/.env.example` for required environment variables:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `VITE_QUALTRICS_SURVEY_URL` - Qualtrics survey URL

## License

[Add your license here]
