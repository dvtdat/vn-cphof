import { NextResponse } from 'next/server'

export function ok(data: unknown) {
  return NextResponse.json(data)
}

/** Error envelope - SPEC §7.2 */
export function notFound(message = 'Not found') {
  return NextResponse.json(
    { error: { code: 'not_found', message } },
    { status: 404 }
  )
}

export function badRequest(message: string) {
  return NextResponse.json(
    { error: { code: 'bad_request', message } },
    { status: 400 }
  )
}
