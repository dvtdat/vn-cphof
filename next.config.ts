import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // CSP (SPEC §10.3). 'unsafe-inline' styles are required by Next's style
  // injection. App Router streams RSC flight data via inline <script> tags,
  // so script-src must allow inline execution or every page hydrates blank;
  // tightening this back up requires the nonce-middleware pattern.
  ...(process.env.NODE_ENV === 'production'
    ? [
        {
          key: 'Content-Security-Policy',
          value:
            "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://flagcdn.com; font-src 'self'; connect-src 'self'; frame-ancestors 'none'",
        },
      ]
    : []),
]

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
}

export default withNextIntl(nextConfig)
