'use client'

import { Avatar } from '@/components/hof/tokens'
import { Link, useRouter } from '@/i18n/navigation'
import { fetchSearch } from '@/lib/api/client'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

export function SearchCommand() {
  const t = useTranslations('nav')
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) {
      setQ('')
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const { data } = useQuery({
    queryKey: ['search', q],
    queryFn: () => fetchSearch(q),
    enabled: open && q.trim().length >= 2,
  })

  const close = () => setOpen(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-64 items-center justify-between gap-3 rounded-md border border-white/25 bg-white/10 px-3.5 py-2 text-xs text-white/70 hover:border-white/40 hover:bg-white/15 hover:text-white"
        aria-haspopup="dialog"
      >
        <span className="flex items-center gap-2">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.5" y2="16.5" />
          </svg>
          {t('search')}…
        </span>
        <kbd className="rounded border border-white/25 px-1.5 py-0.5 font-mono text-2xs text-white/60">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh]">
          <button
            type="button"
            tabIndex={-1}
            aria-label={t('close')}
            onClick={close}
            className="absolute inset-0 cursor-default bg-ink/30"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('search')}
            className="relative w-[35rem] max-w-[92vw] overflow-hidden rounded-xl border border-line bg-card shadow-lg"
          >
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`${t('search')}…`}
              className="w-full border-b border-line bg-card px-4 py-3.5 text-sm outline-none placeholder:text-ink-faint"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && data?.profiles[0]) {
                  router.push(`/p/${data.profiles[0].slug}`)
                  close()
                }
              }}
            />
            <div
              className="max-h-[50vh] overflow-y-auto p-2"
              aria-live="polite"
            >
              {data && (
                <>
                  {data.profiles.length > 0 && (
                    <Section label={t('leaderboard')}>
                      {data.profiles.map((p) => (
                        <Link
                          key={p.id}
                          href={`/p/${p.slug}`}
                          onClick={close}
                          className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent-soft"
                        >
                          <Avatar name={p.fullName} id={p.id} />
                          <span className="text-sm font-bold">
                            {p.fullName}
                          </span>
                          {p.displayHandle && (
                            <span className="font-mono text-2xs text-ink-soft">
                              @{p.displayHandle}
                            </span>
                          )}
                        </Link>
                      ))}
                    </Section>
                  )}
                  {data.contests.length > 0 && (
                    <Section label={t('contests')}>
                      {data.contests.map((c) => (
                        <Link
                          key={c.id}
                          href={`/contests/${c.slug}`}
                          onClick={close}
                          className="block rounded-md px-3 py-2 text-body font-medium hover:bg-accent-soft"
                        >
                          {c.shortName}{' '}
                          <span className="text-ink-soft">· {c.name}</span>
                        </Link>
                      ))}
                    </Section>
                  )}
                  {data.organizations.length > 0 && (
                    <Section label={t('organizations')}>
                      {data.organizations.map((o) => (
                        <Link
                          key={o.id}
                          href={`/organizations/${o.slug}`}
                          onClick={close}
                          className="block rounded-md px-3 py-2 text-body font-medium hover:bg-accent-soft"
                        >
                          {o.name}
                        </Link>
                      ))}
                    </Section>
                  )}
                  {data.departments.length > 0 && (
                    <Section label={t('departments')}>
                      {data.departments.map((dep) => (
                        <Link
                          key={dep.code}
                          href={`/departments/${dep.code}`}
                          onClick={close}
                          className="block rounded-md px-3 py-2 text-body font-medium hover:bg-accent-soft"
                        >
                          {dep.name}
                        </Link>
                      ))}
                    </Section>
                  )}
                </>
              )}
              {q.trim().length < 2 && (
                <p className="px-3 py-6 text-center text-xs text-ink-faint">
                  Aa…
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Section({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-1">
      <div className="label px-3 pb-1 pt-2">{label}</div>
      {children}
    </div>
  )
}
