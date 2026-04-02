/** Supabase embeds FK as `companies`; UI expects `company` (single object). */
export type CompanyEmbed = {
  name: string
  logo_url: string | null
  description: string | null
  website: string | null
} | null

export function normalizeJobRow<T extends Record<string, unknown>>(
  row: T & { companies?: CompanyEmbed | CompanyEmbed[] | null | unknown }
): Omit<T, 'companies'> & { company: CompanyEmbed } {
  const raw = row.companies as CompanyEmbed | CompanyEmbed[] | null | undefined
  const company: CompanyEmbed = Array.isArray(raw) ? raw[0] ?? null : raw ?? null
  const { companies: _drop, ...rest } = row
  return { ...(rest as T), company }
}

export function normalizeJobRows<T extends Record<string, unknown>>(
  rows: (T & { companies?: CompanyEmbed | CompanyEmbed[] | null | unknown })[]
): Array<Omit<T, 'companies'> & { company: CompanyEmbed }> {
  return rows.map(normalizeJobRow)
}
