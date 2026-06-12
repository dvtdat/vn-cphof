/**
 * Canonical organization registry for ICPC Vietnam National 2021–2025.
 *
 * Source of truth is org-seeds.json - hand-curated from the 160 raw
 * organization spellings on the official scoreboards
 * (https://icpcvn.github.io/{year}/national/scoreboard.html):
 * - `name` is the Vietnamese primary name; `nameEn` the English one.
 * - Member universities of ĐHQG Hà Nội / ĐHQG TP.HCM / ĐH Đà Nẵng / ĐH Huế
 *   use the member format, e.g. "Trường Đại học Công nghệ, ĐHQG Hà Nội" →
 *   "University of Engineering and Technology, VNU".
 * - `shortName` (universities only) is the common abbreviation.
 * - High schools carry the MOE unit code (post-2025 merged provinces;
 *   university-administered schools use codes 35–42).
 * - `raw` lists every scoreboard spelling mapping to the org; the scrape
 *   script (scripts/scrape-icpcvn.mjs) resolves teams through it and fails
 *   loudly on any unmapped name.
 */
import type { Organization } from '@/lib/api/schemas'
import { slugify } from '@/lib/text'
import seeds from './org-seeds.json'

type OrgSeed = {
  id: string
  name: string
  nameEn: string
  type: 'university' | 'high_school'
  shortName?: string
  countryCode?: string
  departmentCode?: string
  raw: string[]
}

const SEEDS = seeds as OrgSeed[]

export const icpcVnOrganizations: Organization[] = SEEDS.map((s) => ({
  id: s.id,
  slug: slugify(s.name),
  name: s.name,
  nameEn: s.nameEn,
  shortName: s.shortName,
  type: s.type,
  countryCode: s.countryCode,
  departmentCode: s.departmentCode,
  aliases: s.raw,
}))

/** Every raw scoreboard spelling → canonical org id. */
export const rawOrgNameMap: Record<string, string> = Object.fromEntries(
  SEEDS.flatMap((s) => s.raw.map((r) => [r, s.id]))
)
