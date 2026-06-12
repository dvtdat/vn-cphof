import { notFound, ok } from '@/lib/api/http'
import { getDepartment } from '@/lib/api/store'

export async function GET(
  _: Request,
  ctx: { params: Promise<{ code: string }> }
) {
  const { code } = await ctx.params
  const department = getDepartment(code)
  return department ? ok(department) : notFound()
}
