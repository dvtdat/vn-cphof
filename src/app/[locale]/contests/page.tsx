import { Link } from '@/i18n/navigation'
import { listContests } from '@/lib/api/store'
import { localName } from '@/lib/text'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

interface Props {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'contest' })
  return { title: t('indexTitle') }
}

const SCOPE_ORDER = [
  'international',
  'regional',
  'national',
  'departmental',
] as const

export default async function ContestsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'contest' })
  const contests = listContests()

  const scopeLabel = {
    international: t('scopeInternational'),
    regional: t('scopeRegional'),
    national: t('scopeNational'),
    departmental: t('scopeDepartmental'),
  }

  return (
    <div>
      <div className="reveal">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight">
          {t('indexTitle')}
        </h1>
        <p className="mt-1.5 text-body text-ink-soft">{t('indexSubtitle')}</p>
      </div>

      <table className="reveal mt-9 w-full border-collapse">
        <caption className="sr-only">{t('indexTitle')}</caption>
        <thead>
          <tr>
            <th
              scope="col"
              className="label border-b border-line-strong px-3 pb-2.5 text-left font-medium"
            >
              {t('contestCol')}
            </th>
            <th
              scope="col"
              className="label border-b border-line-strong px-3 pb-2.5 text-left font-medium"
            >
              {t('formatCol')}
            </th>
            <th
              scope="col"
              className="label w-32 border-b border-line-strong px-3 pb-2.5 text-right font-medium"
            >
              {t('editions')}
            </th>
            <th
              scope="col"
              className="label w-36 border-b border-line-strong px-3 pb-2.5 text-right font-medium"
            >
              {t('yearsCol')}
            </th>
          </tr>
        </thead>
        {SCOPE_ORDER.map((scope) => {
          const group = contests.filter((c) => c.scope === scope)
          if (!group.length) return null
          return (
            <tbody key={scope}>
              <tr>
                <th
                  scope="rowgroup"
                  colSpan={4}
                  className="label border-b border-line px-3 pb-2 pt-7 text-left font-medium text-accent"
                >
                  {scopeLabel[scope]}
                </th>
              </tr>
              {group.map((c) => (
                <tr key={c.id} className="hover:bg-accent-soft">
                  <td className="border-b border-line px-3 py-3">
                    <Link
                      href={`/contests/${c.slug}`}
                      className="text-sm font-extrabold tracking-tight hover:text-accent"
                    >
                      {localName(locale, c.name, c.nameEn)}
                    </Link>
                  </td>
                  <td className="border-b border-line px-3 py-3 font-mono text-2xs uppercase tracking-[0.0625rem] text-ink-faint">
                    {c.isTeamBased ? t('formatTeam') : t('formatIndividual')}
                  </td>
                  <td className="border-b border-line px-3 py-3 text-right font-mono text-xs tabular-nums text-ink-soft">
                    {c.editionCount}
                  </td>
                  <td className="border-b border-line px-3 py-3 text-right font-mono text-xs tabular-nums text-ink-soft">
                    {c.firstYear === c.lastYear
                      ? c.firstYear
                      : `${c.firstYear}–${c.lastYear}`}
                  </td>
                </tr>
              ))}
            </tbody>
          )
        })}
      </table>
    </div>
  )
}
