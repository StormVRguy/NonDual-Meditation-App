// Resolve the group for a user from the users table.
// Returns empty string if the user has no group set.

// deno-lint-ignore no-explicit-any
export async function resolveUserGroup(supabase: any, userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('users')
    .select('"group"')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('resolveUserGroup error:', error)
    return ''
  }

  return data?.group ?? ''
}
