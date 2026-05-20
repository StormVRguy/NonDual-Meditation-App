// Qualtrics survey URLs (baked in at build time via Vite env).
// Each dashboard variant must use only its dedicated variable — no cross-fallback.

export const qualtricsSurveyUrls = {
  default: import.meta.env.VITE_QUALTRICS_SURVEY_URL,
  secondary: import.meta.env.VITE_QUALTRICS_SURVEY_URL_2,
  cohortOne: import.meta.env.VITE_QUALTRICS_SURVEY_URL_3,
  cohortTwo: import.meta.env.VITE_QUALTRICS_SURVEY_URL_4,
}
