import { ok } from '@/lib/api/http'
import { search } from '@/lib/api/store'

export function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q') ?? ''
  return ok(search(q))
}
