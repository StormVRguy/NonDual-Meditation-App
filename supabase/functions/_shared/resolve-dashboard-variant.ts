// Maps users.group (from DB) to an opaque dashboard variant key.
// Case-insensitive, whitespace-trimmed.
// Returns null for unknown/empty groups so the frontend can show a generic error.

const VARIANT_MAP: Record<string, string> = {
  exp1: 'groupOne',
  exp2: 'groupTwo',
  c1: 'cohortOne',
  c2: 'cohortTwo',
}

export function resolveDashboardVariant(group: string | null | undefined): string | null {
  if (!group || typeof group !== 'string') return null
  const normalized = group.trim().toLowerCase()
  return VARIANT_MAP[normalized] ?? null
}
