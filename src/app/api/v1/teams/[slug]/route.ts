import { notFound, ok } from '@/lib/api/http'
import { getTeam } from '@/lib/api/store'

export async function GET(
  _: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params
  const team = getTeam(slug)
  return team ? ok(team) : notFound()
}
