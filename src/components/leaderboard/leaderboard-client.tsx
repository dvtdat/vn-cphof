'use client'

import {
  DeptTag,
  MedalCluster,
  PersonCell,
  RankNum,
} from '@/components/hof/tokens'
import { InfiniteSelect, StaticSelect } from '@/components/select-infinite'
import { Link, usePathname, useRouter } from '@/i18n/navigation'
import {
  fetchDepartmentOptions,
  fetchLeaderboard,
  fetchOrganizationOptions,
} from '@/lib/api/client'
import type { LeaderboardMode, LeaderboardResponse } from '@/lib/api/schemas'
import { cn } from '@/lib/utils'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef } from 'react'

const MODES: LeaderboardMode[] = [
  'overall',
  'ioi',
  'apio',
  'icpc',
  'voi',
  'olp',
  'departmental',
]
const YEARS = [2025, 2024, 2023, 2022]

interface Query {
  mode: LeaderboardMode
  department?: string
  organization?: string
  year?: number
}

export function LeaderboardClient({
  initialQuery,
  initialData,
  selectedDepartmentLabel,
  selectedOrganizationLabel,
}: {
  initialQuery: Query
  initialData: LeaderboardResponse
  selectedDepartmentLabel?: string
  selectedOrganizationLabel?: string
}) {
  const t = useTranslations('leaderboard')
  const tm = useTranslations('modes')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const query: Query = useMemo(() => {
    const mode =
      (searchParams.get('mode') as LeaderboardMode) ?? initialQuery.mode
    return {
      mode: MODES.includes(mode) ? mode : 'overall',
      department: searchParams.get('department') ?? undefined,
      organization: searchParams.get('organization') ?? undefined,
      year: searchParams.get('year')
        ? Number(searchParams.get('year'))
        : undefined,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const setParam = useCallback(
    (key: string, value: string | undefined) => {
      const sp = new URLSearchParams(searchParams.toString())
      if (value) sp.set(key, value)
      else sp.delete(key)
      router.replace(`${pathname}?${sp.toString()}` as never, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  const isInitialQuery = JSON.stringify(query) === JSON.stringify(initialQuery)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    isError,
  } = useInfiniteQuery({
    queryKey: ['leaderboard', query],
    queryFn: ({ pageParam }) =>
      fetchLeaderboard({ ...query, cursor: pageParam, limit: 50 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    ...(isInitialQuery && {
      initialData: { pages: [initialData], pageParams: [undefined] },
    }),
  })

  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage)
          fetchNextPage()
      },
      { rootMargin: '300px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const rows = data?.pages.flatMap((p) => p.items) ?? []
  const total = data?.pages[0]?.total ?? 0
  const configVersion = data?.pages[0]?.configVersion ?? 1

  return (
    <div>
      <div
        role="tablist"
        aria-label="Ranking mode"
        className="mt-6 flex gap-0.5 border-b border-line-strong"
      >
        {MODES.map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={query.mode === m}
            onClick={() => setParam('mode', m === 'overall' ? undefined : m)}
            className={cn(
              '-mb-px border-b-2 px-4 pb-2.5 pt-2.5 text-sm font-semibold',
              query.mode === m
                ? 'border-accent font-bold text-accent'
                : 'border-transparent text-ink-soft hover:text-ink'
            )}
          >
            {tm(m)}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <InfiniteSelect
          label={t('filterDepartment')}
          value={query.department}
          onChange={(v) => setParam('department', v)}
          selectedLabel={selectedDepartmentLabel}
          allLabel={t('filterAll')}
          queryKey={`departments-${locale}`}
          queryFn={(cursor) => fetchDepartmentOptions(cursor, 15, locale)}
        />
        <InfiniteSelect
          label={t('filterOrganization')}
          value={query.organization}
          onChange={(v) => setParam('organization', v)}
          selectedLabel={selectedOrganizationLabel}
          allLabel={t('filterAll')}
          queryKey="organizations"
          queryFn={fetchOrganizationOptions}
        />
        <StaticSelect
          label={t('filterYear')}
          value={query.year ? String(query.year) : undefined}
          onChange={(v) => setParam('year', v)}
          allLabel={t('filterAll')}
          options={YEARS.map((y) => ({ value: String(y), label: String(y) }))}
        />
        <span className="ml-auto font-mono text-2xs text-ink-faint">
          {t('scoringNote', { version: configVersion })}
        </span>
      </div>

      <table className="mt-3.5 w-full border-collapse">
        <caption className="sr-only">{t('title')}</caption>
        <thead>
          <tr>
            <Th className="w-14">{t('rank')}</Th>
            <Th>{t('person')}</Th>
            <Th>{t('department')}</Th>
            <Th>{t('medals')}</Th>
            {query.mode === 'overall' && (
              <Th className="text-right" ariaSort="descending">
                {t('score')} ▾
              </Th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => (
            <tr key={e.profile.id} className="group hover:bg-accent-soft">
              <td
                className={cn(
                  'border-b border-line px-3.5 py-3',
                  e.rank <= 3 &&
                    'shadow-[inset_0.1875rem_0_0_var(--color-accent)]'
                )}
              >
                <RankNum rank={e.rank} top3={e.rank <= 3} />
              </td>
              <td className="border-b border-line px-3.5 py-3">
                <Link
                  href={`/p/${e.profile.slug}`}
                  className="block hover:text-accent"
                >
                  <PersonCell profile={e.profile} />
                </Link>
              </td>
              <td className="border-b border-line px-3.5 py-3">
                {e.profile.departmentCode ? (
                  <Link href={`/departments/${e.profile.departmentCode}`}>
                    <DeptTag
                      code={e.profile.departmentCode}
                      name={
                        locale === 'en'
                          ? (e.departmentNameEn ?? e.departmentName)
                          : e.departmentName
                      }
                    />
                  </Link>
                ) : (
                  <span className="text-ink-faint">-</span>
                )}
              </td>
              <td className="border-b border-line px-3.5 py-3">
                <MedalCluster summary={e.medalSummary} />
              </td>
              {query.mode === 'overall' && (
                <td className="border-b border-line px-3.5 py-3 text-right font-mono text-body tabular-nums">
                  {e.points?.toLocaleString('vi-VN')}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {isPending && (
        <p className="py-8 text-center text-sm text-ink-soft">{t('loading')}</p>
      )}
      {isError && <p className="py-8 text-center text-sm text-ink-soft">⚠</p>}
      {!isPending && rows.length === 0 && (
        <p className="py-10 text-center text-sm text-ink-soft">{t('empty')}</p>
      )}

      <div
        aria-live="polite"
        className="mt-4 text-center font-mono text-2xs text-ink-faint"
      >
        {rows.length > 0 && t('loaded', { count: rows.length, total })}
      </div>

      <div ref={sentinelRef} aria-hidden="true" />
      {hasNextPage && (
        <div className="mt-3 flex justify-center">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="rounded-md bg-wash px-4.5 py-2 text-body font-bold text-ink-soft hover:bg-accent-soft hover:text-accent disabled:opacity-50"
          >
            {isFetchingNextPage ? t('loading') : `${t('loadMore')} ↓`}
          </button>
        </div>
      )}
    </div>
  )
}

function Th({
  children,
  className,
  ariaSort,
}: {
  children: React.ReactNode
  className?: string
  ariaSort?: 'ascending' | 'descending'
}) {
  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={cn(
        'border-b border-line-strong px-3.5 py-2.5 text-left font-mono text-2xs font-medium uppercase tracking-[0.08125rem] text-ink-soft',
        className
      )}
    >
      {children}
    </th>
  )
}
