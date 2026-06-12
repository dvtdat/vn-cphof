import { notFound, ok } from '@/lib/api/http'
import { getEditionResults } from '@/lib/api/store'

export async function GET(
  _: Request,
  ctx: { params: Promise<{ slug: string; edition: string }> }
) {
  const { slug, edition } = await ctx.params
  const results = getEditionResults(slug, edition)
  return results ? ok(results) : notFound()
}
