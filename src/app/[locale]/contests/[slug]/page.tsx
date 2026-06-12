import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { getContest, listContests } from '@/lib/api/store'
import { localName } from '@/lib/text'

type Props = { params: Promise<{ locale: string; slug: string }> }

export function generateStaticParams() {
  return listContests().map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const c = getContest(slug)
  return c ? { title: c.shortName, description: localName(locale, c.name, c.nameEn) } : {}
}

export default async function ContestPage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'contest' })
  const c = getContest(slug)
  if (!c) notFound()

  return (
    <div>
      <div className="reveal">
        <div className="label">{t('indexTitle')}</div>
        <h1 className="mt-1.5 text-3xl font-extrabold leading-tight tracking-tight">
          {localName(locale, c.name, c.nameEn)}
        </h1>
        <p className="mt-2 flex items-center gap-2.5 text-body text-ink-soft">
          <span className="font-mono text-2xs uppercase tracking-[0.0625rem]">
            {
              {
                international: t('scopeInternational'),
                regional: t('scopeRegional'),
                national: t('scopeNational'),
                departmental: t('scopeDepartmental'),
              }[c.scope]
            }
            {' · '}
            {c.isTeamBased ? t('formatTeam') : t('formatIndividual')}
          </span>
          {c.homepageUrl && (
            <a
              href={c.homepageUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-accent hover:underline"
            >
              {t('homepage')} ↗
            </a>
          )}
        </p>
        {c.description && (
          <p className="mt-2 max-w-[68ch] text-body leading-relaxed text-ink-soft">
            {c.description}
          </p>
        )}
      </div>

      <div className="reveal mt-7">
        <div className="label">{t('editions')}</div>
        <table className="mt-2.5 w-full">
          <tbody>
            {c.editions.map((e) => (
              <tr key={e.id} className="hover:bg-accent-soft">
                <td className="w-20 border-b border-line px-3 py-3 font-mono text-xs text-ink-soft">
                  {e.year}
                </td>
                <td className="border-b border-line px-3 py-3 text-sm font-bold">
                  <Link href={`/contests/${c.slug}/${e.year}`} className="hover:text-accent">
                    {localName(locale, e.editionLabel, e.editionLabelEn)}
                  </Link>
                </td>
                <td className="border-b border-line px-3 py-3 text-xs text-ink-soft">
                  {e.location ?? ''}
                </td>
                <td className="border-b border-line px-3 py-3 text-right font-mono text-2xs text-ink-faint">
                  {e.resultCount > 0
                    ? t(c.isTeamBased ? 'teamCount' : 'resultCount', { count: e.resultCount })
                    : '·'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
