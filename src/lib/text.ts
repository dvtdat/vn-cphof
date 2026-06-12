/** Diacritic-insensitive normalization - SPEC §7.2 / §10.4 */
export function stripDiacritics(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
}

export function normalizeForSearch(s: string): string {
  return stripDiacritics(s).toLowerCase().trim()
}

/** URL-safe ASCII slug - SPEC §7.2 */
export function slugify(s: string): string {
  return normalizeForSearch(s)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Vietnamese-aware name collation - SPEC §9 */
export const viCollator = new Intl.Collator('vi')

/** Initials for avatar placeholders (last two name parts: "Lê Quang Minh" → "QM") */
export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  const picked = parts.length >= 2 ? parts.slice(-2) : parts
  return stripDiacritics(picked.map((p) => p.charAt(0)).join('')).toUpperCase()
}

/** Localized date / date-range label for contest editions */
export function formatDateRange(
  locale: string,
  start?: string,
  end?: string
): string | null {
  if (!start) return null
  const tag = locale === 'vi' ? 'vi-VN' : 'en-US'
  const dtf = new Intl.DateTimeFormat(tag, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const s = new Date(start)
  if (!end || end === start) return dtf.format(s)
  return dtf.formatRange(s, new Date(end))
}

/** Deterministic small hash for per-entity color tokens */
export function hashIndex(s: string, buckets: number): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h % buckets
}

/** Pick the localized variant of a VI-primary name pair. */
export function localName(
  locale: string,
  name: string,
  nameEn?: string
): string {
  return locale === 'en' ? (nameEn ?? name) : name
}
