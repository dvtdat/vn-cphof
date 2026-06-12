/**
 * Mock backend query logic - SPEC §6 (ranking) + §7 (API contract).
 * Route handlers under /api/v1 are thin wrappers around these functions;
 * server components may call them directly (no HTTP round-trip).
 * Deleted wholesale when the real backend lands.
 */
import { normalizeForSearch, slugify, viCollator } from '@/lib/text'
import {
  achievements,
  contests,
  departments,
  editions,
  organizations,
  profiles,
  rankingConfig,
  teams,
  visualTierMap,
} from '@/mocks/fixtures'
import type {
  Achievement,
  AchievementCategory,
  ContestProblem,
  LeaderboardMode,
  LeaderboardResponse,
  Profile,
  ProfileSummary,
  RankedEntry,
  SearchResponse,
  VisualTier,
} from './schemas'

// ── indexes ──────────────────────────────────────────────────────────
const profileById = new Map(profiles.map((p) => [p.id, p]))
const profileBySlug = new Map(profiles.map((p) => [p.slug, p]))
const deptByCode = new Map(departments.map((d) => [d.code, d]))
const orgById = new Map(organizations.map((o) => [o.id, o]))
const orgBySlug = new Map(organizations.map((o) => [o.slug, o]))
// Legacy alias: orgs renamed to Vietnamese keep resolving by their
// English-derived slug (old URLs redirect to the canonical slug).
const orgBySlugAlias = new Map(
  organizations.flatMap((o) =>
    o.nameEn && !orgBySlug.has(slugify(o.nameEn))
      ? [[slugify(o.nameEn), o] as const]
      : []
  )
)
const contestById = new Map(contests.map((c) => [c.id, c]))
const contestBySlug = new Map(contests.map((c) => [c.slug, c]))
const editionById = new Map(editions.map((e) => [e.id, e]))
const teamById = new Map(teams.map((t) => [t.id, t]))
const teamBySlug = new Map(teams.map((t) => [t.slug, t]))

/** Member summaries for a team roster, skipping unknown profile ids */
function membersOf(memberProfileIds: string[]): ProfileSummary[] {
  return memberProfileIds.flatMap((id) => {
    const p = profileById.get(id)
    return p ? [toSummary(p)] : []
  })
}

/** Achievements credited to a person - team results credit each member (SPEC §6.1) */
const achievementsByProfile = new Map<string, Achievement[]>()
for (const a of achievements) {
  const ids =
    a.subject.kind === 'profile'
      ? [a.subject.profileId]
      : (teamById.get(a.subject.teamId)?.memberProfileIds ?? [])
  for (const id of ids) {
    const list = achievementsByProfile.get(id) ?? []
    list.push(a)
    achievementsByProfile.set(id, list)
  }
}

export function weightOf(a: Achievement): number {
  // Indexed by arbitrary fixture strings - Partial keeps the undefined case
  // visible despite noUncheckedIndexedAccess being off.
  const byTier: Partial<Record<string, number>> =
    rankingConfig.weights[a.category]
  return byTier[a.resultTier] ?? 0
}

export function visualTierOf(a: Achievement): VisualTier {
  return visualTierMap[a.resultTier] ?? 'neutral'
}

const MODE_CATEGORIES: Record<
  Exclude<LeaderboardMode, 'overall'>,
  AchievementCategory[]
> = {
  ioi: ['ioi'],
  apio: ['apio'],
  icpc: ['icpc_wf', 'icpc_asia', 'icpc_vn'],
  voi: ['voi'],
  olp: ['olp'],
  departmental: ['departmental'],
}

export function toSummary(p: Profile): ProfileSummary {
  return {
    id: p.id,
    slug: p.slug,
    fullName: p.fullName,
    displayHandle: p.displayHandle,
    avatarUrl: p.avatarUrl,
    departmentCode: p.hometownDepartmentCode,
  }
}

function medalSummary(list: Achievement[]) {
  const counts: Record<VisualTier, number> = {
    gold: 0,
    silver: 0,
    bronze: 0,
    neutral: 0,
  }
  for (const a of list) counts[visualTierOf(a)]++
  return (['gold', 'silver', 'bronze', 'neutral'] as const)
    .filter((t) => counts[t] > 0)
    .map((t) => ({ visualTier: t, count: counts[t] }))
}

export interface LeaderboardQuery {
  mode?: LeaderboardMode
  department?: string
  organization?: string
  category?: AchievementCategory
  year?: number
  cursor?: string
  limit?: number
}

/** SPEC §7.1 GET /leaderboard - computed server-side (§6.4) */
export function queryLeaderboard(q: LeaderboardQuery): LeaderboardResponse {
  const mode = q.mode ?? 'overall'
  const limit = Math.min(Math.max(q.limit ?? 50, 1), 100)
  const offset = q.cursor ? Math.max(parseInt(q.cursor, 10) || 0, 0) : 0

  const rows = profiles
    .filter((p) => p.status === 'published')
    .filter((p) => !q.department || p.hometownDepartmentCode === q.department)
    .filter(
      (p) =>
        !q.organization ||
        p.organizations.some((s) => s.organizationId === q.organization)
    )
    .map((p) => {
      let list = achievementsByProfile.get(p.id) ?? []
      if (mode !== 'overall') {
        const cats = MODE_CATEGORIES[mode]
        list = list.filter((a) => cats.includes(a.category))
      }
      if (q.category) list = list.filter((a) => a.category === q.category)
      if (q.year) list = list.filter((a) => a.year === q.year)
      const points = list.reduce((sum, a) => sum + weightOf(a), 0)
      const tiers: Record<VisualTier, number> = {
        gold: 0,
        silver: 0,
        bronze: 0,
        neutral: 0,
      }
      for (const a of list) tiers[visualTierOf(a)]++
      return { p, list, points, tiers }
    })
    .filter((r) => r.list.length > 0)

  // Overall: weighted points. Category modes: lexicographic medal table (§6.1).
  rows.sort((a, b) => {
    if (mode === 'overall' && b.points !== a.points) return b.points - a.points
    if (mode !== 'overall') {
      for (const t of ['gold', 'silver', 'bronze', 'neutral'] as const) {
        if (b.tiers[t] !== a.tiers[t]) return b.tiers[t] - a.tiers[t]
      }
      if (b.points !== a.points) return b.points - a.points
    }
    return viCollator.compare(a.p.fullName, b.p.fullName)
  })

  const page = rows.slice(offset, offset + limit)
  const items: RankedEntry[] = page.map((r, i) => ({
    rank: offset + i + 1,
    profile: toSummary(r.p),
    departmentName: r.p.hometownDepartmentCode
      ? deptByCode.get(r.p.hometownDepartmentCode)?.name
      : undefined,
    departmentNameEn: r.p.hometownDepartmentCode
      ? deptByCode.get(r.p.hometownDepartmentCode)?.nameEn
      : undefined,
    medalSummary: medalSummary(r.list),
    points: mode === 'overall' ? r.points : r.points || undefined,
  }))

  return {
    items,
    nextCursor: offset + limit < rows.length ? String(offset + limit) : null,
    total: rows.length,
    configVersion: rankingConfig.version,
  }
}

// ── Profile expansion - SPEC §7.1 GET /profiles/:slug ────────────────
export function getProfile(slug: string) {
  const p = profileBySlug.get(slug)
  if (p?.status !== 'published') return null
  const list = (achievementsByProfile.get(p.id) ?? [])
    .slice()
    .sort((a, b) => b.year - a.year)

  const expanded = list.map((a) => {
    const edition = editionById.get(a.contestEditionId)
    const contest = edition ? contestById.get(edition.contestId) : undefined
    const team =
      a.subject.kind === 'team' ? teamById.get(a.subject.teamId) : undefined
    return {
      ...a,
      editionLabel: edition?.editionLabel ?? '',
      contestSlug: contest?.slug ?? '',
      contestShortName: contest?.shortName ?? '',
      location: edition?.location,
      teamName: team?.name,
      teamSlug: team?.slug,
      visualTier: visualTierOf(a),
      points: weightOf(a),
    }
  })

  const overall = queryLeaderboard({ mode: 'overall', limit: 100 })
  let overallRank = overall.items.find((e) => e.profile.id === p.id)?.rank
  if (!overallRank) {
    // beyond page 1 - walk pages (fixture-scale, cheap)
    let cursor: string | null = '100'
    while (cursor && !overallRank) {
      const page: LeaderboardResponse = queryLeaderboard({
        mode: 'overall',
        cursor,
        limit: 100,
      })
      overallRank = page.items.find((e) => e.profile.id === p.id)?.rank
      cursor = page.nextCursor
    }
  }

  const memberTeams = teams
    .filter((t) => t.memberProfileIds.includes(p.id))
    .map((t) => ({
      ...t,
      organization: orgById.get(t.organizationId),
      edition: editionById.get(t.contestEditionId),
    }))

  return {
    ...p,
    organizations: p.organizations.map((s) => ({
      ...s,
      organization: orgById.get(s.organizationId),
    })),
    department: p.hometownDepartmentCode
      ? deptByCode.get(p.hometownDepartmentCode)
      : undefined,
    achievements: expanded,
    teams: memberTeams,
    overallRank,
    totalPoints: list.reduce((sum, a) => sum + weightOf(a), 0),
    medalSummary: medalSummary(list),
    configVersion: rankingConfig.version,
  }
}
export type ProfileExpanded = NonNullable<ReturnType<typeof getProfile>>

// ── Contests - SPEC §7.1 ─────────────────────────────────────────────
export function listContests() {
  return contests.map((c) => {
    const eds = editions.filter((e) => e.contestId === c.id)
    const years = eds.map((e) => e.year)
    return {
      ...c,
      editionCount: eds.length,
      firstYear: years.length ? Math.min(...years) : undefined,
      lastYear: years.length ? Math.max(...years) : undefined,
    }
  })
}

/** All (contest slug, edition year) pairs - for generateStaticParams */
export function listEditionParams() {
  return editions.flatMap((e) => {
    const contest = contestById.get(e.contestId)
    return contest ? [{ slug: contest.slug, edition: String(e.year) }] : []
  })
}

export function getContest(slug: string) {
  const c = contestBySlug.get(slug)
  if (!c) return null
  return {
    ...c,
    editions: editions
      .filter((e) => e.contestId === c.id)
      .sort((a, b) => b.year - a.year)
      .map((e) => ({
        ...e,
        resultCount: c.isTeamBased
          ? teams.filter((t) => t.contestEditionId === e.id).length
          : achievements.filter((a) => a.contestEditionId === e.id).length,
      })),
  }
}

export function getEditionResults(
  contestSlug: string,
  editionLabelOrYear: string
) {
  const c = contestBySlug.get(contestSlug)
  if (!c) return null
  const e = editions.find(
    (e) =>
      e.contestId === c.id &&
      (String(e.year) === editionLabelOrYear ||
        e.editionLabel === editionLabelOrYear)
  )
  if (!e) return null
  const results = achievements
    .filter((a) => a.contestEditionId === e.id)
    .map((a) => {
      const team =
        a.subject.kind === 'team' ? teamById.get(a.subject.teamId) : undefined
      const profile =
        a.subject.kind === 'profile'
          ? profileById.get(a.subject.profileId)
          : undefined
      return {
        ...a,
        visualTier: visualTierOf(a),
        profile: profile ? toSummary(profile) : undefined,
        departmentName: profile?.hometownDepartmentCode
          ? deptByCode.get(profile.hometownDepartmentCode)?.name
          : undefined,
        departmentNameEn: profile?.hometownDepartmentCode
          ? deptByCode.get(profile.hometownDepartmentCode)?.nameEn
          : undefined,
        team: team
          ? {
              ...team,
              organization: orgById.get(team.organizationId),
              members: membersOf(team.memberProfileIds),
            }
          : undefined,
      }
    })
    .sort(
      (a, b) => (a.rank ?? 999) - (b.rank ?? 999) || weightOf(b) - weightOf(a)
    )

  // ICPC-style scoreboard for team-based editions: rank, team+org, points,
  // penalty, per-problem submission cells. The edition's declared problem set
  // wins (shows every problem, even ones nobody submitted to); fall back to
  // labels derived from submissions for editions without one.
  let scoreboard = null
  if (c.isTeamBased) {
    const rows = teams
      .filter((t) => t.contestEditionId === e.id)
      .map((t) => ({
        ...t,
        organization: orgById.get(t.organizationId),
        members: membersOf(t.memberProfileIds),
      }))
      .sort((a, b) => (a.result?.rank ?? 999) - (b.result?.rank ?? 999))
    const seenLabels = [
      ...new Set(
        rows.flatMap((r) => r.result?.problems?.map((p) => p.label) ?? [])
      ),
    ]
    // Single-letter labels imply a contiguous A..max set - fill the gaps so
    // problems nobody submitted to still get a column.
    const derivedLabels =
      seenLabels.length > 0 && seenLabels.every((l) => /^[A-Z]$/.test(l))
        ? Array.from(
            {
              length: Math.max(...seenLabels.map((l) => l.charCodeAt(0))) - 64,
            },
            (_, i) => String.fromCharCode(65 + i)
          )
        : seenLabels.sort()
    const problems: ContestProblem[] =
      e.problems && e.problems.length > 0
        ? e.problems
        : derivedLabels.map((label) => ({ label }))
    if (rows.length > 0) scoreboard = { problems, rows }
  }

  return { contest: c, edition: e, results, scoreboard }
}

// ── Departments - SPEC §7.1 ──────────────────────────────────────────
function deptAggregate(code: string) {
  const people = profiles.filter(
    (p) => p.status === 'published' && p.hometownDepartmentCode === code
  )
  const tiers: Record<VisualTier, number> = {
    gold: 0,
    silver: 0,
    bronze: 0,
    neutral: 0,
  }
  for (const p of people)
    for (const a of achievementsByProfile.get(p.id) ?? [])
      tiers[visualTierOf(a)]++
  const orgIds = new Set(
    organizations.filter((o) => o.departmentCode === code).map((o) => o.id)
  )
  return { peopleCount: people.length, tiers, organizationCount: orgIds.size }
}

export function listDepartments() {
  return departments
    .map((dep) => ({ ...dep, ...deptAggregate(dep.code) }))
    .sort((a, b) => a.code.localeCompare(b.code))
}

export function getDepartment(code: string) {
  const dep = deptByCode.get(code)
  if (!dep) return null
  const lb = queryLeaderboard({ mode: 'overall', department: code, limit: 100 })
  return {
    ...dep,
    ...deptAggregate(code),
    people: lb.items,
    organizations: organizations.filter((o) => o.departmentCode === code),
  }
}

// ── Organizations - SPEC §7.1 ────────────────────────────────────────
export type OrganizationFilter =
  | 'high_school'
  | 'university'
  | 'university_intl'

function isIntl(o: { countryCode?: string }) {
  return !!o.countryCode && o.countryCode !== 'vn'
}

export function listOrganizations(type?: OrganizationFilter) {
  return organizations
    .filter((o) => {
      if (!type) return true
      if (type === 'high_school') return o.type === 'high_school'
      if (type === 'university') return o.type === 'university' && !isIntl(o)
      return o.type === 'university' && isIntl(o)
    })
    .map((o) => ({
      ...o,
      departmentName: o.departmentCode
        ? deptByCode.get(o.departmentCode)?.name
        : undefined,
      departmentNameEn: o.departmentCode
        ? deptByCode.get(o.departmentCode)?.nameEn
        : undefined,
      peopleCount: profiles.filter((p) =>
        p.organizations.some((s) => s.organizationId === o.id)
      ).length,
      teamCount: teams.filter((t) => t.organizationId === o.id).length,
    }))
    .sort((a, b) => b.peopleCount - a.peopleCount)
}

const SCOPE_ORDER = [
  'international',
  'regional',
  'national',
  'departmental',
] as const

export function getOrganization(slug: string) {
  const o = orgBySlug.get(slug) ?? orgBySlugAlias.get(slug)
  if (!o) return null
  const lb = queryLeaderboard({
    mode: 'overall',
    organization: o.id,
    limit: 100,
  })
  const orgTeams = teams
    .filter((t) => t.organizationId === o.id)
    .map((t) => ({ ...t, edition: editionById.get(t.contestEditionId) }))
  type OrgTeam = (typeof orgTeams)[number]
  type DatedOrgTeam = OrgTeam & { edition: NonNullable<OrgTeam['edition']> }
  const byContest = new Map<string, DatedOrgTeam[]>()
  for (const t of orgTeams) {
    const { edition } = t
    if (!edition) continue
    const list = byContest.get(edition.contestId) ?? []
    list.push({ ...t, edition })
    byContest.set(edition.contestId, list)
  }
  const teamsByContest = [...byContest.entries()]
    .flatMap(([contestId, list]) => {
      const contest = contestById.get(contestId)
      if (!contest) return []
      list.sort(
        (a, b) =>
          b.edition.year - a.edition.year ||
          (a.result?.rank ?? Infinity) - (b.result?.rank ?? Infinity)
      )
      const years = list.map((t) => t.edition.year)
      return [
        {
          contest,
          teams: list,
          firstYear: Math.min(...years),
          lastYear: Math.max(...years),
        },
      ]
    })
    .sort(
      (a, b) =>
        SCOPE_ORDER.indexOf(a.contest.scope) -
          SCOPE_ORDER.indexOf(b.contest.scope) ||
        a.contest.name.localeCompare(b.contest.name)
    )
  return {
    ...o,
    departmentName: o.departmentCode
      ? deptByCode.get(o.departmentCode)?.name
      : undefined,
    departmentNameEn: o.departmentCode
      ? deptByCode.get(o.departmentCode)?.nameEn
      : undefined,
    people: lb.items,
    teams: orgTeams,
    teamsByContest,
  }
}

// ── Teams - SPEC §7.1 ────────────────────────────────────────────────
export function getTeam(slug: string) {
  const t = teamBySlug.get(slug)
  if (!t) return null
  const edition = editionById.get(t.contestEditionId)
  const coach = t.coach?.profileId
    ? profileById.get(t.coach.profileId)
    : undefined
  return {
    ...t,
    organization: orgById.get(t.organizationId),
    edition,
    contest: edition ? contestById.get(edition.contestId) : undefined,
    members: membersOf(t.memberProfileIds),
    coachProfile: coach ? toSummary(coach) : undefined,
  }
}

// ── Search - diacritic-insensitive - SPEC §7.2 ───────────────────────
export function search(qRaw: string): SearchResponse {
  const q = normalizeForSearch(qRaw)
  if (q.length < 2)
    return { profiles: [], contests: [], organizations: [], departments: [] }
  const match = (...fields: (string | undefined)[]) =>
    fields.some((f) => f && normalizeForSearch(f).includes(q))
  return {
    profiles: profiles
      .filter(
        (p) => p.status === 'published' && match(p.fullName, p.displayHandle)
      )
      .slice(0, 5)
      .map(toSummary),
    contests: contests.filter((c) => match(c.name, c.shortName)).slice(0, 5),
    organizations: organizations
      .filter((o) => match(o.name, o.shortName, ...o.aliases))
      .slice(0, 5),
    departments: departments
      .filter((dep) =>
        match(
          dep.name,
          dep.nameEn,
          ...dep.historicalAliases.flatMap((a) => [a.name, a.nameEn])
        )
      )
      .slice(0, 5),
  }
}

export function getRankingConfig() {
  return rankingConfig
}

// ── Cursor pagination for option lists - SPEC §7.2 ───────────────────
export interface ListPage<T> {
  items: T[]
  nextCursor: string | null
  total: number
}

export function pageList<T>(
  list: T[],
  cursor?: string,
  limit = 20
): ListPage<T> {
  const l = Math.min(Math.max(limit, 1), 100)
  const offset = cursor ? Math.max(parseInt(cursor, 10) || 0, 0) : 0
  return {
    items: list.slice(offset, offset + l),
    nextCursor: offset + l < list.length ? String(offset + l) : null,
    total: list.length,
  }
}
