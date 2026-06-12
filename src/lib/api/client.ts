/**
 * Typed API client for client components - SPEC §7.
 * Swap NEXT_PUBLIC_API_BASE_URL when the real backend lands; zero component changes.
 */
import { z } from 'zod'
import {
  leaderboardResponseSchema,
  searchResponseSchema,
  type LeaderboardResponse,
  type SearchResponse,
} from './schemas'
import type { LeaderboardQuery } from './store'

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''

const errorBodySchema = z.object({ error: z.object({ message: z.string() }) })

async function get<T>(path: string, parse: (data: unknown) => T): Promise<T> {
  const res = await fetch(`${BASE}/api/v1${path}`)
  if (!res.ok) {
    const body = errorBodySchema.safeParse(await res.json().catch(() => null))
    throw new Error(
      body.success ? body.data.error.message : `API error ${res.status}`
    )
  }
  return parse(await res.json())
}

export function fetchLeaderboard(
  q: LeaderboardQuery
): Promise<LeaderboardResponse> {
  const sp = new URLSearchParams()
  if (q.mode) sp.set('mode', q.mode)
  if (q.department) sp.set('department', q.department)
  if (q.organization) sp.set('organization', q.organization)
  if (q.category) sp.set('category', q.category)
  if (q.year) sp.set('year', String(q.year))
  if (q.cursor) sp.set('cursor', q.cursor)
  if (q.limit) sp.set('limit', String(q.limit))
  return get(`/leaderboard?${sp}`, (d) => leaderboardResponseSchema.parse(d))
}

export function fetchSearch(q: string): Promise<SearchResponse> {
  return get(`/search?q=${encodeURIComponent(q)}`, (d) =>
    searchResponseSchema.parse(d)
  )
}

// ── Paged option lists for infinite-scroll selects ───────────────────

export interface OptionPage {
  items: { value: string; label: string }[]
  nextCursor: string | null
}

const pageOf = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
    total: z.number(),
  })

const deptOptionPage = pageOf(
  z.object({
    code: z.string(),
    name: z.string(),
    nameEn: z.string().optional(),
  })
)
const orgOptionPage = pageOf(z.object({ id: z.string(), name: z.string() }))

export async function fetchDepartmentOptions(
  cursor?: string,
  limit = 15,
  locale = 'vi'
): Promise<OptionPage> {
  const sp = new URLSearchParams({ limit: String(limit) })
  if (cursor) sp.set('cursor', cursor)
  const page = await get(`/departments?${sp}`, (d) => deptOptionPage.parse(d))
  return {
    items: page.items.map((d) => ({
      value: d.code,
      label: locale === 'en' ? (d.nameEn ?? d.name) : d.name,
    })),
    nextCursor: page.nextCursor,
  }
}

export async function fetchOrganizationOptions(
  cursor?: string,
  limit = 15
): Promise<OptionPage> {
  const sp = new URLSearchParams({ limit: String(limit) })
  if (cursor) sp.set('cursor', cursor)
  const page = await get(`/organizations?${sp}`, (d) => orgOptionPage.parse(d))
  return {
    items: page.items.map((o) => ({ value: o.id, label: o.name })),
    nextCursor: page.nextCursor,
  }
}
