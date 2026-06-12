import { notFound, ok } from '@/lib/api/http'
import { getContest } from '@/lib/api/store'

export async function GET(
  _: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params
  const contest = getContest(slug)
  return contest ? ok(contest) : notFound()
}
