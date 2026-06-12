import { notFound, ok } from '@/lib/api/http'
import { getProfile } from '@/lib/api/store'

export async function GET(_: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  const profile = getProfile(slug)
  return profile ? ok(profile) : notFound()
}
