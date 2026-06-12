import { ok } from '@/lib/api/http'
import { getRankingConfig } from '@/lib/api/store'

export function GET() {
  return ok(getRankingConfig())
}
