import { badRequest, ok } from '@/lib/api/http'
import type { OrganizationFilter } from '@/lib/api/store'
import { listOrganizations, pageList } from '@/lib/api/store'

export function GET(request: Request) {
  const sp = new URL(request.url).searchParams
  const type = sp.get('type')
  if (
    type &&
    type !== 'high_school' &&
    type !== 'university' &&
    type !== 'university_intl'
  )
    return badRequest('invalid type')
  return ok(
    pageList(
      listOrganizations((type as OrganizationFilter | null) ?? undefined),
      sp.get('cursor') ?? undefined,
      sp.get('limit') ? Number(sp.get('limit')) : undefined
    )
  )
}
