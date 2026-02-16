# Phase 4: Qualtrics Integration

Phase 4 is implemented: the questionnaire button opens the Qualtrics survey and logs the start in `daily_logs`. Optional: redirect respondents to a thank-you page when they finish the survey.

## What’s in place

- **Dashboard**: “Complete Questionnaire” opens `VITE_QUALTRICS_SURVEY_URL` in a new tab (enabled only after ~90% of meditation is played).
- **Logging**: Before opening, the app calls `logs-questionnaire-start` so `daily_logs.questionnaire_started_at` is set for today.
- **Thank-you page**: Route `/questionnaire-complete` shows a short “Thank you” message and a “Back to Dashboard” link.
- **Pre-fill Codice**: If `VITE_QUALTRICS_CODICE_QID` is set, the link includes `Q_PopulateResponse=...` so Qualtrics pre-fills that question with the user’s personal code.

## Environment

In your root `.env`:

```env
VITE_QUALTRICS_SURVEY_URL=https://your-project.qualtrics.com/jfe/form/SV_xxxxxxxx
```

For pre-filling the Codice question (required for the code to be passed):

```env
VITE_QUALTRICS_CODICE_QID=QID12
```

**Important:** Use the question’s **Question ID** (e.g. `QID1`, `QID5`), **not** the question’s export code or description. A question whose “code” is “Codice” still has an internal ID like `QID5` – that is what Qualtrics expects.

## Pre-filling the Codice question with Q_PopulateResponse

The app adds **`Q_PopulateResponse={"QIDxx":"<code>"}`** to the survey URL when the user has a personal code and `VITE_QUALTRICS_CODICE_QID` is set. Qualtrics uses this to pre-fill that question.

### What to do in Qualtrics

1. **Question for Codice**  
   - Add a **Text Entry** question (or use an existing one) for the code (e.g. “Codice”).  
   - It can be visible or hidden (e.g. with display logic).

2. **Find the Question ID (QID)**  
   - In the survey editor, click the Codice question.  
   - The **Question ID** is the internal ID (e.g. `QID1`, `QID5`), **not** the export code “Codice”.  
   - Look for **Question ID** in the left panel or question settings; or use **Tools** / export or view options that show QIDs (e.g. “QID5 – Codice”).

3. **Configure the app**  
   - In your app’s `.env`, set:  
     `VITE_QUALTRICS_CODICE_QID=QID5`  
     (use the **actual QID** from step 2, not the word “Codice”).  
   - Restart the dev server or rebuild the frontend so the env var is loaded.

4. **Publish**  
   - Publish the survey in Qualtrics so the question is active.

5. **If it still doesn’t pre-fill**  
   - Open the browser console (F12) before clicking the questionnaire button. In development you’ll see a log with the full URL and the QID used.  
   - Confirm the opened tab’s URL contains `Q_PopulateResponse=` and that the value looks like `%7B%22QID5%22%3A%22...` (encoded `{"QID5":"..."}`).  
   - If you see “No personal_code on user”, log out and log in again.  
   - If you see “VITE_QUALTRICS_CODICE_QID not set”, add it to `.env` and restart the app.

When users open the questionnaire from the app, Qualtrics will receive `Q_PopulateResponse={"QIDxx":"..."}` and pre-fill that question.

Redeploy the auth function after any backend change:  
`supabase functions deploy auth-login`

## Optional: Redirect after survey completion

To send respondents to your app’s thank-you page when they finish the survey:

1. In Qualtrics: edit your survey → **Survey flow** (or **End of Survey**).
2. Add an **End of Survey** action: **Redirect to a URL**.
3. Set the URL to your app’s completion page, e.g.:
   - Local: `http://localhost:5173/questionnaire-complete`
   - Production: `https://yourdomain.com/questionnaire-complete`

You can append query params if you need them (e.g. `?id=...`). The app does not require any params for the thank-you page.

## Deploy

Ensure the questionnaire logging function is deployed:

```bash
supabase functions deploy logs-questionnaire-start
```

No new migrations are required for Phase 4.
