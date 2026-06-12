import {
  MedalCluster,
  PersonCell,
  Seal,
  StatCard,
} from '@/components/hof/tokens'
import { Link } from '@/i18n/navigation'
import { getDepartment } from '@/lib/api/store'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ locale: string; code: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, code } = await params
  const d = getDepartment(code)
  return d ? { title: locale === 'en' ? d.nameEn : d.name } : {}
}

export default async function DepartmentPage({ params }: Props) {
  const { locale, code } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'department' })
  const tp = await getTranslations({ locale, namespace: 'profile' })
  const tl = await getTranslations({ locale, namespace: 'leaderboard' })
  const d = getDepartment(code)
  if (!d) notFound()
  const name = locale === 'en' ? d.nameEn : d.name

  return (
    <div>
      <div className="reveal flex flex-wrap items-center gap-5">
        <Seal code={d.code} />
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight">
            {name}
          </h1>
          <p className="mt-1 text-body text-ink-soft">
            {t('hallOfFamers', { count: d.peopleCount })} ·{' '}
            {t('organizationsRepresented', { count: d.organizations.length })}
            {d.historicalAliases.length > 0 && (
              <span className="text-ink-faint">
                {' '}
                ·{' '}
                {t('formerly', {
                  names: d.historicalAliases
                    .map((a) => (locale === 'en' ? a.nameEn : a.name))
                    .join(', '),
                })}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2.5">
          <StatCard value={d.tiers.gold} label={tp('gold')} accent />
          <StatCard value={d.tiers.silver} label={tp('silver')} />
          <StatCard value={d.tiers.bronze} label={tp('bronze')} />
        </div>
      </div>

      <hr className="my-6 border-line" />

      <div className="reveal">
        <div className="label">{t('allFrom', { name })}</div>
        <table className="mt-2.5 w-full border-collapse">
          <caption className="sr-only">{t('allFrom', { name })}</caption>
          <thead>
            <tr>
              <Th>{tl('person')}</Th>
              <Th>{tl('medals')}</Th>
            </tr>
          </thead>
          <tbody>
            {d.people.map((e) => (
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
    </div>
  )
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
      className={
        'border-b border-line-strong px-3.5 py-2.5 text-left font-mono text-2xs font-medium uppercase tracking-[0.08125rem] text-ink-soft ' +
        (className ?? '')
      }
    >
      {children}
    </th>
  )
}
