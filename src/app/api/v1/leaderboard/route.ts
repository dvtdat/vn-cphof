import { ok, badRequest } from '@/lib/api/http'
import { leaderboardModeSchema, achievementCategorySchema } from '@/lib/api/schemas'
import { queryLeaderboard } from '@/lib/api/store'

export function GET(request: Request) {
  const sp = new URL(request.url).searchParams
  const mode = leaderboardModeSchema.safeParse(sp.get('mode') ?? 'overall')
  if (!mode.success) return badRequest('invalid mode')
  const category = sp.get('category')
    ? achievementCategorySchema.safeParse(sp.get('category'))
    : undefined
  if (category && !category.success) return badRequest('invalid category')

  return ok(
    queryLeaderboard({
      mode: mode.data,
      department: sp.get('department') ?? undefined,
      organization: sp.get('organization') ?? undefined,
      category: category?.data,
      year: sp.get('year') ? Number(sp.get('year')) : undefined,
      cursor: sp.get('cursor') ?? undefined,
      limit: sp.get('limit') ? Number(sp.get('limit')) : undefined,
    }),
  )
}
