import { z } from 'zod'

// ── Taxonomy - SPEC §5 ──────────────────────────────────────────────
export const achievementCategorySchema = z.enum([
  'ioi',
  'apio',
  'intl_other',
  'icpc_wf',
  'icpc_asia',
  'icpc_vn',
  'voi',
  'tst',
  'olp',
  'departmental',
])
export type AchievementCategory = z.infer<typeof achievementCategorySchema>

// Compact display mapping - SPEC §6.5. Lives in taxonomy data, not components.
export const visualTierSchema = z.enum(['gold', 'silver', 'bronze', 'neutral'])
export type VisualTier = z.infer<typeof visualTierSchema>

const httpUrl = z
  .string()
  .url()
  .regex(/^https?:\/\//, 'http(s) only') // SPEC §10.3

// ── Department - SPEC §4.6 ──────────────────────────────────────────
export const departmentSchema = z.object({
  code: z.string(),
  name: z.string(),
  nameEn: z.string(),
  historicalAliases: z.array(
    z.object({ name: z.string(), nameEn: z.string(), validUntil: z.number() })
  ),
})
export type Department = z.infer<typeof departmentSchema>

// ── Organization - SPEC §4.5 ────────────────────────────────────────
export const organizationSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(), // Vietnamese, primary
  nameEn: z.string().optional(),
  shortName: z.string().optional(),
  type: z.enum(['high_school', 'university']),
  countryCode: z.string().length(2).optional(), // ISO 3166-1 alpha-2; absent = vn
  departmentCode: z.string().optional(), // high schools only - universities have no department

  aliases: z.array(z.string()),
  logoUrl: z.string().optional(),
})
export type Organization = z.infer<typeof organizationSchema>

// ── Profile - SPEC §4.1 ─────────────────────────────────────────────
export const externalAccountSchema = z.object({
  platform: z.enum([
    'codeforces',
    'atcoder',
    'topcoder',
    'vnoj',
    'codechef',
    'github',
    'other',
  ]),
  handle: z.string(),
  url: httpUrl,
})
export type ExternalAccount = z.infer<typeof externalAccountSchema>

export const ratingBadgeSchema = z.object({
  platform: z.enum(['codeforces', 'atcoder']),
  title: z.string(),
  colorToken: z.string(),
})
export type RatingBadge = z.infer<typeof ratingBadgeSchema>

export const organizationAffiliationSchema = z.object({
  organizationId: z.string(),
  role: z.enum(['student', 'coach']),
  eraLabel: z.string().optional(),
})

export const profileSchema = z.object({
  id: z.string(),
  slug: z.string(),
  fullName: z.string(),
  displayHandle: z.string().optional(),
  bio: z.string().optional(), // PLAIN TEXT only - SPEC §10.3
  avatarUrl: z.string().optional(),
  hometownDepartmentCode: z.string().optional(),
  organizations: z.array(organizationAffiliationSchema),
  externalAccounts: z.array(externalAccountSchema),
  ratingBadges: z.array(ratingBadgeSchema).optional(),
  status: z.enum(['published', 'hidden']),
})
export type Profile = z.infer<typeof profileSchema>

// ── Contest - SPEC §4.3 ─────────────────────────────────────────────
export const contestSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(), // Vietnamese, primary
  nameEn: z.string().optional(),
  shortName: z.string(),
  category: achievementCategorySchema,
  scope: z.enum(['international', 'regional', 'national', 'departmental']),
  isTeamBased: z.boolean(),
  description: z.string().optional(),
  homepageUrl: httpUrl.optional(),
})
export type Contest = z.infer<typeof contestSchema>

/** One problem in a contest edition's problem set (ICPC-style) */
export const contestProblemSchema = z.object({
  label: z.string(), // 'A', 'B', …
  name: z.string().optional(), // problem title, when known
  statementUrl: httpUrl.optional(), // link to the original statement
})
export type ContestProblem = z.infer<typeof contestProblemSchema>

export const contestEditionSchema = z.object({
  id: z.string(),
  contestId: z.string(),
  editionLabel: z.string(), // Vietnamese, primary
  editionLabelEn: z.string().optional(),
  year: z.number(),
  location: z.string().optional(), // city, country - display string
  venue: z.string().optional(),
  countryCode: z.string().length(2).optional(), // ISO 3166-1 alpha-2, drives the flag
  dateStart: z.string().optional(), // ISO 8601
  dateEnd: z.string().optional(),
  officialUrl: httpUrl.optional(),
  hostOrganizationId: z.string().optional(),
  problems: z.array(contestProblemSchema).optional(), // full problem set, in label order
})
export type ContestEdition = z.infer<typeof contestEditionSchema>

// ── Achievement - SPEC §4.2 ─────────────────────────────────────────
export const achievementSubjectSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('profile'), profileId: z.string() }),
  z.object({ kind: z.literal('team'), teamId: z.string() }),
])
export type AchievementSubject = z.infer<typeof achievementSubjectSchema>

export const achievementSchema = z.object({
  id: z.string(),
  subject: achievementSubjectSchema,
  contestEditionId: z.string(),
  category: achievementCategorySchema,
  resultTier: z.string(),
  rank: z.number().optional(),
  year: z.number(),
  departmentAliasRef: z.string().optional(),
  proofUrl: httpUrl.optional(),
  verificationStatus: z.enum(['verified', 'pending']),
  notes: z.string().optional(),
})
export type Achievement = z.infer<typeof achievementSchema>

// ── Team - SPEC §4.4 ────────────────────────────────────────────────
/** One problem cell on an ICPC scoreboard */
export const problemCellSchema = z.object({
  label: z.string(), // 'A', 'B', …
  solvedAt: z.number().optional(), // minutes from contest start; absent = unsolved
  tries: z.number().min(1),
  firstSolve: z.boolean().optional(), // first team to solve - dark-green cell
})
export type ProblemCell = z.infer<typeof problemCellSchema>

export const teamSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  organizationId: z.string(),
  contestEditionId: z.string(),
  teamType: z.enum(['university', 'high_school']),
  countryCode: z.string().length(2).optional(), // flag on scoreboards (defaults to vn)
  memberProfileIds: z.array(z.string()).max(3), // may be empty when members are unknown
  coach: z
    .object({
      profileId: z.string().optional(),
      freeText: z.string().optional(),
    })
    .optional(),
  result: z
    .object({
      rank: z.number().optional(),
      medal: z.string().optional(),
      solved: z.number().optional(),
      penalty: z.number().optional(),
      problems: z.array(problemCellSchema).optional(),
    })
    .optional(),
})
export type Team = z.infer<typeof teamSchema>

// ── RankingConfig - SPEC §4.7 ───────────────────────────────────────
export const rankingConfigSchema = z.object({
  version: z.number(),
  weights: z.record(z.string(), z.record(z.string(), z.number())),
})
export type RankingConfig = z.infer<typeof rankingConfigSchema>

// ── API response shapes - SPEC §7 ───────────────────────────────────
export const leaderboardModeSchema = z.enum([
  'overall',
  'ioi',
  'apio',
  'icpc',
  'voi',
  'olp',
  'departmental',
])
export type LeaderboardMode = z.infer<typeof leaderboardModeSchema>

export const profileSummarySchema = z.object({
  id: z.string(),
  slug: z.string(),
  fullName: z.string(),
  displayHandle: z.string().optional(),
  avatarUrl: z.string().optional(),
  departmentCode: z.string().optional(),
})
export type ProfileSummary = z.infer<typeof profileSummarySchema>

export const medalSummaryEntrySchema = z.object({
  visualTier: visualTierSchema,
  count: z.number(),
})

export const rankedEntrySchema = z.object({
  rank: z.number(),
  profile: profileSummarySchema,
  departmentName: z.string().optional(),
  departmentNameEn: z.string().optional(),
  medalSummary: z.array(medalSummaryEntrySchema),
  points: z.number().optional(),
})
export type RankedEntry = z.infer<typeof rankedEntrySchema>

export const leaderboardResponseSchema = z.object({
  items: z.array(rankedEntrySchema),
  nextCursor: z.string().nullable(),
  total: z.number(),
  configVersion: z.number(),
})
export type LeaderboardResponse = z.infer<typeof leaderboardResponseSchema>

export const searchResponseSchema = z.object({
  profiles: z.array(profileSummarySchema),
  contests: z.array(contestSchema),
  organizations: z.array(organizationSchema),
  departments: z.array(departmentSchema),
})
export type SearchResponse = z.infer<typeof searchResponseSchema>

export const errorEnvelopeSchema = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
})
