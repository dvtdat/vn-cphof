import { PersonCell, StatCard } from '@/components/hof/tokens'
import { Link } from '@/i18n/navigation'
import { getTeam } from '@/lib/api/store'
import { localName } from '@/lib/text'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const team = getTeam(slug)
  if (!team) return {}
  const label = team.edition
    ? localName(locale, team.edition.editionLabel, team.edition.editionLabelEn)
    : ''
  return { title: `${team.name} · ${label}` }
}

export default async function TeamPage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'team' })
  const tc = await getTranslations({ locale, namespace: 'contest' })
  const to = await getTranslations({ locale, namespace: 'organization' })
  const team = getTeam(slug)
  if (!team) notFound()

  const cells = new Map(team.result?.problems?.map((p) => [p.label, p]))
  const problemSet: { label: string; name?: string; statementUrl?: string }[] =
    team.edition?.problems && team.edition.problems.length > 0
      ? team.edition.problems
      : (team.result?.problems?.map((p) => ({ label: p.label })) ?? [])

  return (
    <div>
      <div className="reveal">
        <div className="label">
          ICPC ·{' '}
          {team.teamType === 'university' ? to('university') : to('highSchool')}
        </div>
        <h1 className="mt-1.5 text-3xl font-extrabold leading-tight tracking-tight">
          {team.name}
        </h1>
        <p className="mt-1.5 text-body text-ink-soft">
          {team.edition && (
            <Link
              href={`/contests/${team.contest?.slug}/${team.edition.year}`}
              className="text-accent hover:underline"
            >
              {localName(
                locale,
                team.edition.editionLabel,
                team.edition.editionLabelEn
              )}
            </Link>
          )}
          {team.edition?.location && ` · ${team.edition.location}`}
        </p>
      </div>

      <div className="reveal mt-6 flex flex-wrap gap-2.5">
        {team.result?.rank && (
          <StatCard value={`#${team.result.rank}`} label={t('result')} accent />
        )}
        {team.result?.solved != null && (
          <StatCard value={team.result.solved} label={t('solved')} />
        )}
        {team.result?.penalty != null && (
          <StatCard value={team.result.penalty} label={t('penalty')} />
        )}
      </div>

      {problemSet.length > 0 && (
        <div className="reveal mt-8">
          <div className="flex items-baseline justify-between">
            <div className="label">{t('problemResults')}</div>
            {team.edition && (
              <Link
                href={`/contests/${team.contest?.slug}/${team.edition.year}`}
                className="text-xs text-accent hover:underline"
              >
                {t('fullScoreboard')} →
              </Link>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {problemSet.map((p) => {
              const cell = cells.get(p.label)
              const solved = cell?.solvedAt != null
              return (
                <div key={p.label} className="w-[3.25rem]">
                  <div className="pb-1 text-center font-mono text-2xs font-medium uppercase tracking-[0.0625rem] text-ink-soft">
                    {p.statementUrl ? (
                      <a
                        href={p.statementUrl}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="underline decoration-dotted underline-offset-2 hover:text-accent"
                      >
                        {p.label}
                      </a>
                    ) : (
                      p.label
                    )}
                  </div>
                  <div
                    className={cn(
                      'flex h-[2.875rem] flex-col items-center justify-center rounded-[0.25rem] border border-line',
                      solved &&
                        !cell.firstSolve &&
                        'border-transparent bg-solve',
                      solved &&
                        cell.firstSolve &&
                        'border-transparent bg-solve-strong text-white',
                      cell && !solved && 'border-transparent bg-fail',
                      !cell && 'bg-paper/40'
                    )}
                  >
                    {cell && (
                      <>
                        {solved && (
                          <span className="font-mono text-xs font-semibold leading-tight tabular-nums">
                            {cell.solvedAt}
                          </span>
                        )}
                        <span
                          className={cn(
                            'text-3xs leading-tight',
                            solved && cell.firstSolve
                              ? 'text-white/85'
                              : 'text-ink-soft'
                          )}
                        >
                          {tc('tries', { count: cell.tries })}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="reveal mt-8">
        <div className="label">{t('organization')}</div>
        <div className="mt-2">
          {team.organization && (
            <Link
              href={`/organizations/${team.organization.slug}`}
              className="text-md font-bold hover:text-accent"
            >
              {localName(
                locale,
                team.organization.name,
                team.organization.nameEn
              )}
            </Link>
          )}
        </div>
      </div>

      <div className="reveal mt-7">
        <div className="label">{t('members')}</div>
        {team.members.length > 0 ? (
          <div className="mt-3 grid grid-cols-3 gap-3">
            {team.members.map((m) => (
              <Link
                key={m.id}
                href={`/p/${m.slug}`}
                className="rounded-lg bg-wash px-4 py-3.5 hover:bg-accent-soft"
              >
                <PersonCell profile={m} />
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-2.5 text-body text-ink-faint">{t('noRoster')}</p>
        )}
        {team.coach && (
          <p className="mt-3.5 text-body text-ink-soft">
            <span className="label">{t('coach')}</span>{' '}
            <span className="ml-1.5 font-medium text-ink">
              {team.coachProfile?.fullName ?? team.coach.freeText}
            </span>
          </p>
        )}
      </div>
    </div>
  )
}
