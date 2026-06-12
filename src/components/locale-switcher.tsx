'use client'

import { useLocale } from 'next-intl'
import { useParams } from 'next/navigation'
import { usePathname, useRouter } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { cn } from '@/lib/utils'

export function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex overflow-hidden rounded-[0.3125rem] border border-white/30"
    >
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={l === locale}
          onClick={() =>
            // @ts-expect-error params are compatible with the current route
            router.replace({ pathname, params }, { locale: l })
          }
          className={cn(
            'px-2.5 py-1.5 font-mono text-2xs font-semibold uppercase',
            l === locale ? 'bg-white text-accent' : 'bg-transparent text-white/60 hover:text-white',
          )}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
