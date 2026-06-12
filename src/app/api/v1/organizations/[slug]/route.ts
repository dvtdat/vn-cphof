import { notFound, ok } from '@/lib/api/http'
import { getOrganization } from '@/lib/api/store'

export async function GET(_: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  const organization = getOrganization(slug)
  return organization ? ok(organization) : notFound()
}
