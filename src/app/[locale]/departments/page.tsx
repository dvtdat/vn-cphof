import { Link } from '@/i18n/navigation'
import { listDepartments } from '@/lib/api/store'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'department' })
  return { title: t('indexTitle') }
}

export default async function DepartmentsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'department' })
  const departments = listDepartments()

  const th = 'label border-b border-line-strong px-3 pb-2.5 font-medium'

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
            <th scope="col" className={cn(th, 'text-left')}>
              {t('nameCol')}
            </th>
            <th scope="col" className={cn(th, 'w-32 text-right')}>
              {t('orgsCol')}
            </th>
          </tr>
        </thead>
        <tbody>
          {departments.map((d) => (
            <tr key={d.code} className="hover:bg-accent-soft">
              <td className="border-b border-line px-3 py-3">
                <Link
                  href={`/departments/${d.code}`}
                  className="group inline-flex items-baseline gap-3"
                >
                  <span
                    aria-hidden="true"
                    className="inline-flex h-6 w-9 flex-none items-center justify-center self-center rounded-[0.25rem] border border-accent/40 bg-accent-softer font-mono text-2xs font-semibold tracking-[0.0625rem] text-accent"
                  >
                    {d.code}
                  </span>
                  <span className="text-sm font-bold group-hover:text-accent">
                    {locale === 'en' ? d.nameEn : d.name}
                  </span>
                  {d.historicalAliases.length > 0 && (
                    <span className="hidden text-2xs text-ink-faint md:inline">
                      {t('formerly', {
                        names: d.historicalAliases
                          .map((a) => (locale === 'en' ? a.nameEn : a.name))
                          .join(', '),
                      })}
                    </span>
                  )}
                </Link>
              </td>
              <td className="border-b border-line px-3 py-3 text-right font-mono text-xs tabular-nums text-ink-soft">
                {d.organizationCount || '·'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
