import { ok } from '@/lib/api/http'
import { listContests } from '@/lib/api/store'

export function GET() {
  return ok(listContests())
}
