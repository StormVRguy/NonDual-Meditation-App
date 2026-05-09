// Map dashboard variant -> list of group names from Supabase users.group.
// Matching is case-insensitive and ignores surrounding whitespace.
const DASHBOARD_GROUPS_BY_VARIANT = {
  groupOne: [
    'Exp1',
  ],
  groupTwo: [
    'Exp2',
  ],
}

function normalizeGroupName(groupName) {
  return typeof groupName === 'string' ? groupName.trim().toLowerCase() : ''
}

const GROUP_TO_VARIANT = Object.entries(DASHBOARD_GROUPS_BY_VARIANT).reduce((acc, [variant, groups]) => {
  for (const group of groups) {
    const normalized = normalizeGroupName(group)
    if (normalized) acc.set(normalized, variant)
  }
  return acc
}, new Map())

export function resolveDashboardVariant(groupName) {
  const normalized = normalizeGroupName(groupName)
  if (!normalized) return null
  return GROUP_TO_VARIANT.get(normalized) ?? null
}
