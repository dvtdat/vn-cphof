import {
  CountryFlag,
  DeptTag,
  MedalToken,
  OrgLogo,
  PersonCell,
  RankNum,
  VerifiedBadge,
} from '@/components/hof/tokens'
import { Link } from '@/i18n/navigation'
import { getEditionResults, listEditionParams } from '@/lib/api/store'
import { formatDateRange, localName } from '@/lib/text'
import { cn } from '@/lib/utils'
import { CalendarDays, Link2, MapPin } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ locale: string; slug: string; edition: string }>
}

/**
 * Pre-render every edition at build time (locale dimension comes from the
 * root layout's generateStaticParams). Fixture data is baked into the bundle,
 * so pages are deterministic until the next deploy. dynamicParams stays on so
 * editionLabel-based URLs still render on demand.
 */
export function generateStaticParams() {
  return listEditionParams()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug, edition } = await params
  const data = getEditionResults(slug, edition)
  return data
    ? {
        title: localName(
          locale,
          data.edition.editionLabel,
          data.edition.editionLabelEn
        ),
      }
    : {}
}

const TIER_KEYS = new Set([
  'gold',
  'silver',
  'bronze',
  'champion',
  'hm',
  'participant',
  'giai-nhat',
  'giai-nhi',
  'giai-ba',
  'khuyen-khich',
  'sieu-cup',
  'selected',
  'rank',
])

export default async function EditionPage({ params }: Props) {
  const { locale, slug, edition } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'contest' })
  const tt = await getTranslations({ locale, namespace: 'tiers' })
  const tp = await getTranslations({ locale, namespace: 'profile' })
  const data = getEditionResults(slug, edition)
  if (!data) notFound()
  const { contest, edition: ed, results } = data
  const tierLabel = (k: string) => (TIER_KEYS.has(k) ? tt(k as never) : k)

  return (
    <div>
      <div className="reveal">
        <div className="label">
          <Link
            href={`/contests/${contest.slug}`}
            className="hover:text-accent"
          >
            {contest.shortName}
          </Link>{' '}
          · {ed.year}
        </div>
        <h1 className="mt-1.5 text-3xl font-extrabold leading-tight tracking-tight">
          {localName(locale, ed.editionLabel, ed.editionLabelEn)}
        </h1>

        <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm font-medium">
          {formatDateRange(locale, ed.dateStart, ed.dateEnd) && (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays
                size={14}
                strokeWidth={2}
                aria-hidden="true"
                className="text-ink-faint"
              />
              <span className="sr-only">{t('date')}: </span>
              {formatDateRange(locale, ed.dateStart, ed.dateEnd)}
            </span>
          )}
          {ed.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin
                size={14}
                strokeWidth={2}
                aria-hidden="true"
                className="text-ink-faint"
              />
              <span className="sr-only">{t('location')}: </span>
              {ed.venue && <span>{ed.venue} ·</span>}
              {ed.countryCode && (
                <CountryFlag countryCode={ed.countryCode} label={ed.location} />
              )}
              {ed.location}
            </span>
          )}
          {ed.officialUrl && (
            <a
              href={ed.officialUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-1.5 text-accent hover:underline"
            >
              <Link2
                size={14}
                strokeWidth={2}
                aria-hidden="true"
                className="text-ink-faint"
              />
              <span className="sr-only">{t('officialPage')}: </span>
              {new URL(ed.officialUrl).hostname} ↗
            </a>
          )}
        </p>
      </div>

      {data.scoreboard ? (
        <Scoreboard
          scoreboard={data.scoreboard}
          labels={{
            rank: '#',
            team: t('teams'),
            points: t('points'),
            penalty: t('penalty'),
          }}
          tries={(count: number) => t('tries', { count })}
          caption={`${localName(locale, ed.editionLabel, ed.editionLabelEn)} - ${t('results')}`}
        />
      ) : (
        <ResultsTable />
      )}
    </div>
  )

  function Scoreboard({
    scoreboard,
    labels,
    tries,
    caption,
  }: {
    scoreboard: NonNullable<typeof data>['scoreboard'] & object
    labels: { rank: string; team: string; points: string; penalty: string }
    tries: (count: number) => string
    caption: string
  }) {
    const { problems, rows } = scoreboard
    // Fixed columns (rank 3 + points 4 + penalty 5) + team min 18 + 3.25 per problem.
    const minRem = 30 + problems.length * 3.25
    // Break out of the content column up to the viewport (minus gutters), centered,
    // so the scrollbar only appears when the table is wider than the viewport itself.
    const width = `clamp(100%, ${minRem}rem, 100vw - 3rem)`
    return (
      <div
        className="reveal mt-7 overflow-x-auto"
        style={{ width, marginInline: `calc((100% - ${width}) / 2)` }}
      >
        <table
          className="w-full table-fixed border-collapse"
          style={{ minWidth: `${minRem}rem` }}
        >
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              <Th className="w-12">{labels.rank}</Th>
              <Th>{labels.team}</Th>
              <Th className="w-16 text-center">{labels.points}</Th>
              <Th className="w-20 text-center">{labels.penalty}</Th>
              {problems.map((p) => (
                <Th key={p.label} className="w-[3.25rem] text-center">
                  {p.statementUrl ? (
                    <a
                      href={p.statementUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      title={p.name ?? p.label}
                      className="underline decoration-dotted underline-offset-2 hover:text-accent"
                    >
                      {p.label}
                    </a>
                  ) : (
                    p.label
                  )}
                </Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const cells = new Map(
                row.result?.problems?.map((p) => [p.label, p])
              )
              const medal = row.result?.medal
              return (
                <tr key={row.id} className="cv-row hover:bg-accent-soft">
                  <td
                    className={cn(
                      'border-b border-line px-3 py-2.5 text-center',
                      medal === 'gold' &&
                        'bg-gold-bg shadow-[inset_0.1875rem_0_0_var(--color-gold)]',
                      medal === 'silver' &&
                        'bg-silver-bg shadow-[inset_0.1875rem_0_0_var(--color-silver)]',
                      medal === 'bronze' &&
                        'bg-bronze-bg shadow-[inset_0.1875rem_0_0_var(--color-bronze)]'
                    )}
                  >
                    <span className="text-md font-extrabold tabular-nums">
                      {row.result?.rank ?? '-'}
                    </span>
                  </td>
                  <td className="border-b border-line px-3 py-2.5">
                    <span className="flex items-center gap-2.5">
                      <CountryFlag
                        countryCode={row.countryCode ?? 'vn'}
                        label={row.countryCode?.toUpperCase() ?? 'VN'}
                        size={32}
                      />
                      <OrgLogo
                        name={
                          row.organization
                            ? localName(
                                locale,
                                row.organization.name,
                                row.organization.nameEn
                              )
                            : row.name
                        }
                        shortName={row.organization?.shortName}
                        logoUrl={row.organization?.logoUrl}
                        size={32}
                      />
                      <span className="min-w-0">
                        <Link
                          href={`/teams/${row.slug}`}
                          className="block truncate text-sm font-bold hover:text-accent"
                        >
                          {row.name}
                        </Link>
                        <span className="block truncate text-2xs text-ink-soft">
                          {row.organization &&
                            localName(
                              locale,
                              row.organization.name,
                              row.organization.nameEn
                            )}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td className="border-b border-line px-3 py-2.5 text-center font-mono text-sm font-semibold tabular-nums">
                    {row.result?.solved ?? 0}
                  </td>
                  <td className="border-b border-line px-3 py-2.5 text-center font-mono text-xs tabular-nums text-ink-soft">
                    {row.result?.penalty ?? '-'}
                  </td>
                  {problems.map(({ label: l }) => {
                    const cell = cells.get(l)
                    if (!cell)
                      return (
                        <td
                          key={l}
                          className="border-b border-line bg-paper/40 px-1 py-1"
                        />
                      )
                    const solved = cell.solvedAt != null
                    return (
                      <td
                        key={l}
                        className={cn(
                          'border-b border-line px-1 py-1 text-center align-middle',
                          solved && !cell.firstSolve && 'bg-solve',
                          solved &&
                            cell.firstSolve &&
                            'bg-solve-strong text-white',
                          !solved && 'bg-fail'
                        )}
                      >
                        {solved && (
                          <span className="block font-mono text-xs font-semibold leading-tight tabular-nums">
                            {cell.solvedAt}
                          </span>
                        )}
                        <span
                          className={cn(
                            'block text-3xs leading-tight',
                            solved && cell.firstSolve
                              ? 'text-white/85'
                              : 'text-ink-soft'
                          )}
                        >
                          {tries(cell.tries)}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  function ResultsTable() {
    return (
      <table className="reveal mt-7 w-full table-fixed border-collapse">
        <caption className="sr-only">
          {ed.editionLabel} - {t('results')}
        </caption>
        <thead>
          <tr>
            <Th className="w-14">#</Th>
            <Th>{contest.isTeamBased ? t('teams') : t('participants')}</Th>
            <Th className="w-56">{contest.isTeamBased ? '' : ''}</Th>
            <Th className="w-36">{t('awardCol')}</Th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.id} className="cv-row hover:bg-accent-soft">
              <td
                className={
                  'border-b border-line px-3.5 py-3 ' +
                  ((r.rank ?? 99) <= 3
                    ? 'shadow-[inset_0.1875rem_0_0_var(--color-accent)]'
                    : '')
                }
              >
                {r.rank ? <RankNum rank={r.rank} top3={r.rank <= 3} /> : '-'}
              </td>
              <td className="border-b border-line px-3.5 py-3">
                {r.profile && (
                  <Link
                    href={`/p/${r.profile.slug}`}
                    className="block hover:text-accent"
                  >
                    <PersonCell profile={r.profile} />
                  </Link>
                )}
                {r.team && (
                  <div>
                    <Link
                      href={`/teams/${r.team.slug}`}
                      className="text-sm font-bold hover:text-accent"
                    >
                      {r.team.name}
                    </Link>
                    <div className="mt-0.5 text-xs text-ink-soft">
                      {r.team.organization &&
                        localName(
                          locale,
                          r.team.organization.name,
                          r.team.organization.nameEn
                        )}{' '}
                      ·{' '}
                      {r.team.members.map((m, i) => (
                        <span key={m.id}>
                          {i > 0 && ', '}
                          <Link
                            href={`/p/${m.slug}`}
                            className="hover:text-accent"
                          >
                            {m.fullName}
                          </Link>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </td>
              <td className="border-b border-line px-3.5 py-3">
                {r.departmentName && r.profile?.departmentCode && (
                  <DeptTag
                    code={r.profile.departmentCode}
                    name={
                      locale === 'en'
                        ? (r.departmentNameEn ?? r.departmentName)
                        : r.departmentName
                    }
                  />
                )}
              </td>
              <td className="border-b border-line px-3.5 py-3">
                <span className="inline-flex items-center gap-2">
                  <MedalToken
                    tier={r.visualTier}
                    word={tierLabel(r.resultTier)}
                  />
                  {r.verificationStatus === 'verified' && (
                    <VerifiedBadge label={tp('verified')} />
                  )}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <th
      scope="col"
      className={cn(
        'border-b border-line-strong px-3.5 py-2.5 text-left font-mono text-2xs font-medium uppercase tracking-[0.08125rem] text-ink-soft',
        className
      )}
    >
      {children}
    </th>
  )
}
