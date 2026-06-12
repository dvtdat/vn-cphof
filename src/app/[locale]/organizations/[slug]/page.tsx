import { DeptTag, MedalCluster, PersonCell } from '@/components/hof/tokens'
import { Link, redirect } from '@/i18n/navigation'
import { getOrganization } from '@/lib/api/store'
import { localName } from '@/lib/text'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const o = getOrganization(slug)
  return o ? { title: localName(locale, o.name, o.nameEn) } : {}
}

export default async function OrganizationPage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'organization' })
  const tl = await getTranslations({ locale, namespace: 'leaderboard' })
  const tc = await getTranslations({ locale, namespace: 'contest' })
  const tt = await getTranslations({ locale, namespace: 'team' })
  const o = getOrganization(slug)
  if (!o) notFound()
  if (o.slug !== slug) redirect({ href: `/organizations/${o.slug}`, locale })

  return (
    <div>
      <div className="reveal">
        <div className="label">
          {o.type === 'university' ? t('university') : t('highSchool')}
        </div>
        <h1 className="mt-1.5 text-3xl font-extrabold leading-tight tracking-tight">
          {localName(locale, o.name, o.nameEn)}
        </h1>
        {o.departmentCode && (
          <div className="mt-2.5">
            <Link href={`/departments/${o.departmentCode}`}>
              <DeptTag
                code={o.departmentCode}
                name={
                  locale === 'en'
                    ? (o.departmentNameEn ?? o.departmentName)
                    : o.departmentName
                }
              />
            </Link>
          </div>
        )}
      </div>

      {o.teamsByContest.length > 0 && (
        <div className="reveal mt-7">
          <div className="label">{t('icpcTeams')}</div>
          <div className="mt-2.5 border-t border-line-strong">
            {o.teamsByContest.map((g) => (
              <details
                key={g.contest.id}
                className="group border-b border-line"
                open={o.teamsByContest.length === 1 || undefined}
              >
                <summary className="flex cursor-pointer select-none list-none items-baseline gap-3 px-3.5 py-3 hover:bg-accent-soft [&::-webkit-details-marker]:hidden">
                  <span
                    aria-hidden
                    className="font-mono text-2xs text-ink-faint transition-transform group-open:rotate-90"
                  >
                    ▸
                  </span>
                  <span className="text-body font-bold">
                    {localName(locale, g.contest.name, g.contest.nameEn)}
                  </span>
                  <span className="font-mono text-2xs text-ink-soft">
                    {tc('teamCount', { count: g.teams.length })}
                  </span>
                  <span className="ml-auto font-mono text-xs tabular-nums text-ink-soft">
                    {g.firstYear === g.lastYear
                      ? g.firstYear
                      : `${g.firstYear}–${g.lastYear}`}
                  </span>
                </summary>
                <table className="w-full border-collapse">
                  <caption className="sr-only">
                    {localName(locale, g.contest.name, g.contest.nameEn)}
                  </caption>
                  <thead>
                    <tr>
                      <Th>{tc('teamCol')}</Th>
                      <Th align="right" className="w-20">
                        {tt('solved')}
                      </Th>
                      <Th align="right" className="w-20">
                        {tt('penalty')}
                      </Th>
                      <Th align="right" className="w-16">
                        {tl('rank')}
                      </Th>
                    </tr>
                  </thead>
                  {groupByYear(g.teams).map(([year, yearTeams]) => (
                    <tbody key={year}>
                      <tr>
                        <th
                          scope="rowgroup"
                          colSpan={4}
                          className="label border-b border-line px-3.5 pb-2 pt-4 text-left font-medium text-accent"
                        >
                          {year} ·{' '}
                          {tc('teamCount', { count: yearTeams.length })}
                        </th>
                      </tr>
                      {yearTeams.map((team) => (
                        <tr key={team.id} className="hover:bg-accent-soft">
                          <td className="border-b border-line px-3.5 py-2.5">
                            <Link
                              href={`/teams/${team.slug}`}
                              className="text-body font-bold hover:text-accent"
                            >
                              {team.name}
                            </Link>
                          </td>
                          <td className="border-b border-line px-3.5 py-2.5 text-right font-mono text-xs tabular-nums text-ink-soft">
                            {team.result?.solved ?? ''}
                          </td>
                          <td className="border-b border-line px-3.5 py-2.5 text-right font-mono text-xs tabular-nums text-ink-soft">
                            {team.result?.penalty ?? ''}
                          </td>
                          <td className="border-b border-line px-3.5 py-2.5 text-right font-mono text-xs tabular-nums">
                            {team.result?.rank ? `#${team.result.rank}` : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  ))}
                </table>
              </details>
            ))}
          </div>
        </div>
      )}

      {o.people.length > 0 && (
        <div className="reveal mt-8">
          <div className="label">{t('people')}</div>
          <table className="mt-2.5 w-full border-collapse">
            <caption className="sr-only">{o.name}</caption>
            <thead>
              <tr>
                <Th>{tl('person')}</Th>
                <Th>{tl('medals')}</Th>
              </tr>
            </thead>
            <tbody>
              {o.people.map((e) => (
                <tr key={e.profile.id} className="hover:bg-accent-soft">
                  <td className="border-b border-line px-3.5 py-3">
                    <Link
                      href={`/p/${e.profile.slug}`}
                      className="block hover:text-accent"
                    >
                      <PersonCell profile={e.profile} />
                    </Link>
                  </td>
                  <td className="border-b border-line px-3.5 py-3">
                    <MedalCluster summary={e.medalSummary} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/** Input arrives sorted year desc, rank asc; preserve that order. */
function groupByYear<T extends { edition?: { year: number } }>(
  list: T[]
): [number, T[]][] {
  const groups = new Map<number, T[]>()
  for (const item of list) {
    const year = item.edition?.year ?? 0
    const g = groups.get(year) ?? []
    g.push(item)
    groups.set(year, g)
  }
  return [...groups.entries()]
}

function Th({
  children,
  className,
  align = 'left',
}: {
  children: React.ReactNode
  className?: string
  align?: 'left' | 'right'
}) {
  return (
    <th
      scope="col"
      className={
        `border-b border-line-strong px-3.5 py-2.5 ${align === 'right' ? 'text-right' : 'text-left'} font-mono text-2xs font-medium uppercase tracking-[0.08125rem] text-ink-soft ` +
        (className ?? '')
      }
    >
      {children}
    </th>
  )
}
