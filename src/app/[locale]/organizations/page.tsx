import { CountryFlag, DeptTag, OrgLogo } from '@/components/hof/tokens'
import { Link } from '@/i18n/navigation'
import { listOrganizations } from '@/lib/api/store'
import { localName } from '@/lib/text'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

interface Props {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ type?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'organization' })
  return { title: t('indexTitle') }
}

export default async function OrganizationsPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params
  const { type } = await searchParams
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'organization' })
  const tab =
    type === 'high_school'
      ? 'high_school'
      : type === 'international'
        ? 'university_intl'
        : 'university'
  const orgs = listOrganizations(tab)

  const th = 'label border-b border-line-strong px-3 pb-2.5 font-medium'
  const pill =
    'rounded-full px-4 py-1.5 font-mono text-2xs font-medium uppercase tracking-[0.0625rem]'

  return (
    <div>
      <div className="reveal">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight">
          {t('indexTitle')}
        </h1>
        <p className="mt-1.5 text-body text-ink-soft">{t('indexSubtitle')}</p>
      </div>

      <div className="reveal mt-7 inline-flex gap-1 rounded-full bg-wash p-1">
        <Link
          href="/organizations?type=high_school"
          className={cn(
            pill,
            tab === 'high_school'
              ? 'bg-accent text-white'
              : 'text-ink-soft hover:text-accent'
          )}
        >
          {t('highSchool')}
        </Link>
        <Link
          href="/organizations"
          className={cn(
            pill,
            tab === 'university'
              ? 'bg-accent text-white'
              : 'text-ink-soft hover:text-accent'
          )}
        >
          {t('universityVn')}
        </Link>
        <Link
          href="/organizations?type=international"
          className={cn(
            pill,
            tab === 'university_intl'
              ? 'bg-accent text-white'
              : 'text-ink-soft hover:text-accent'
          )}
        >
          {t('universityIntl')}
        </Link>
      </div>

      {tab !== 'high_school' && (
        <div className="reveal mt-7">
          <table className="mt-2.5 w-full border-collapse">
            <caption className="sr-only">
              {tab === 'university_intl'
                ? t('universityIntl')
                : t('universityVn')}
            </caption>
            <thead>
              <tr>
                <th scope="col" className={cn(th, 'text-left')}>
                  {t('nameCol')}
                </th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((o) => (
                <tr key={o.id} className="hover:bg-accent-soft">
                  <td className="border-b border-line px-3 py-3">
                    <Link
                      href={`/organizations/${o.slug}`}
                      className="group flex items-center gap-3"
                    >
                      <OrgLogo
                        name={o.name}
                        shortName={o.shortName}
                        logoUrl={o.logoUrl}
                        size={22}
                      />
                      {tab === 'university_intl' && o.countryCode && (
                        <CountryFlag countryCode={o.countryCode} size={18} />
                      )}
                      <span className="text-sm font-bold group-hover:text-accent">
                        {localName(locale, o.name, o.nameEn)}
                      </span>
                      {o.shortName && (
                        <span className="font-mono text-2xs uppercase tracking-[0.0625rem] text-ink-faint">
                          {o.shortName}
                        </span>
                      )}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'high_school' && (
        <div className="reveal mt-7">
          <table className="w-full border-collapse">
            <caption className="sr-only">{t('highSchool')}</caption>
            <thead>
              <tr>
                <th scope="col" className={cn(th, 'text-left')}>
                  {t('nameCol')}
                </th>
                <th scope="col" className={cn(th, 'w-60 text-left')}>
                  {t('departmentCol')}
                </th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((o) => (
                <tr key={o.id} className="hover:bg-accent-soft">
                  <td className="border-b border-line px-3 py-3">
                    <Link
                      href={`/organizations/${o.slug}`}
                      className="group flex items-center gap-3"
                    >
                      <OrgLogo
                        name={o.name}
                        shortName={o.shortName}
                        logoUrl={o.logoUrl}
                        size={22}
                      />
                      <span className="text-sm font-bold group-hover:text-accent">
                        {localName(locale, o.name, o.nameEn)}
                      </span>
                    </Link>
                  </td>
                  <td className="border-b border-line px-3 py-2">
                    <DeptTag
                      code={o.departmentCode}
                      name={
                        locale === 'en'
                          ? (o.departmentNameEn ?? o.departmentName)
                          : o.departmentName
                      }
                    />
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
