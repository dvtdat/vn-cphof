import { ok } from '@/lib/api/http'
import { listDepartments, pageList } from '@/lib/api/store'

export function GET(request: Request) {
  const sp = new URL(request.url).searchParams
  return ok(
    pageList(
      listDepartments(),
      sp.get('cursor') ?? undefined,
      sp.get('limit') ? Number(sp.get('limit')) : undefined,
    ),
  )
}
