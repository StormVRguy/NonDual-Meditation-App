// Resolve personal_code for daily_logs from JWT payload (preferred) or users table (legacy tokens)

export async function resolvePersonalCodeForDailyLog(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  userId: string,
  payload: { personal_code?: string }
): Promise<string | null> {
  if (typeof payload.personal_code === 'string' && payload.personal_code.trim().length > 0) {
    return payload.personal_code.trim()
  }
  const { data, error } = await supabase
    .from('users')
    .select('personal_code')
    .eq('id', userId)
    .maybeSingle()
  if (error) {
    console.error('resolvePersonalCodeForDailyLog:', error)
    return null
  }
  return data?.personal_code ?? null
}
