import { AutoLinkText } from '@/components/auto-link-text'
import {
  AccountChip,
  Avatar,
  DeptTag,
  MedalToken,
  VerifiedBadge,
} from '@/components/hof/tokens'
import { Link } from '@/i18n/navigation'
import { getProfile, type ProfileExpanded } from '@/lib/api/store'
import { localName } from '@/lib/text'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const p = getProfile(slug)
  if (!p) return {}
  return {
    title: p.fullName,
    description: `${p.fullName} - Vietnam Competitive Programming Hall of Fame`,
    openGraph: { title: p.fullName, type: 'profile' },
  }
}

export default async function ProfilePage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'profile' })
  const tt = await getTranslations({ locale, namespace: 'tiers' })

  const p = getProfile(slug)
  if (!p) notFound()

  const lifetime = { gold: 0, silver: 0, bronze: 0 }
  for (const m of p.medalSummary)
    if (m.visualTier !== 'neutral') lifetime[m.visualTier] = m.count

  const byCategory = groupTrackRecord(p)
  const tierLabel = (key: string) => (hasTierKey(key) ? tt(key as never) : key)

  return (
    <div className="grid grid-cols-[18.75rem_1fr] items-start gap-7">
      <div className="sticky top-6 flex flex-col gap-4">
        <div className="reveal rounded-xl bg-wash p-5">
          <Avatar name={p.fullName} id={p.id} size="lg" />
          <h1 className="mt-4 text-xl font-extrabold leading-tight tracking-tight">
            {p.fullName}
          </h1>
          {p.displayHandle && (
            <div className="mt-1 font-mono text-xs text-ink-soft">
              @{p.displayHandle}
            </div>
          )}
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {p.department && (
              <Link href={`/departments/${p.department.code}`}>
                <DeptTag code={p.department.code} name={p.department.name} />
              </Link>
            )}
            {p.organizations.map(
              (s) =>
                s.organization && (
                  <Link
                    key={s.organizationId}
                    href={`/organizations/${s.organization.slug}`}
                  >
                    <span className="inline-flex items-center gap-1.5 rounded-[0.3125rem] border border-line bg-card px-2 py-1 text-xs font-medium hover:border-accent">
                      {localName(
                        locale,
                        s.organization.name,
                        s.organization.nameEn
                      )}
                      {s.eraLabel && (
                        <span className="text-ink-faint">· {s.eraLabel}</span>
                      )}
                    </span>
                  </Link>
                )
            )}
          </div>
          {p.bio && (
            <p className="mt-3.5 text-xs leading-relaxed text-ink-soft">
              <AutoLinkText text={p.bio} />
            </p>
          )}
          {p.externalAccounts.length > 0 && (
            <div className="mt-4">
              <div className="label">{t('linkedAccounts')}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {p.externalAccounts.map((a) => (
                  <AccountChip key={a.platform + a.handle} {...a} />
                ))}
                {p.ratingBadges?.map((b) => (
                  <span
                    key={b.platform + b.title}
                    className="inline-flex items-center rounded-md border border-line bg-paper px-2 py-1 font-mono text-2xs font-semibold text-bronze"
                    title={`${b.platform} rating badge - display only`}
                  >
                    {b.title}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="reveal rounded-xl bg-wash px-5 py-4">
          <div className="label">{t('lifetimeMedals')}</div>
          <div className="mt-3 flex gap-6">
            {(['gold', 'silver', 'bronze'] as const).map((tier) => (
              <div key={tier} className="flex flex-col gap-1">
                <span
                  className={cn(
                    'text-2xl font-extrabold leading-none tabular-nums',
                    tier === 'gold' && 'text-gold',
                    tier === 'silver' && 'text-silver',
                    tier === 'bronze' && 'text-bronze'
                  )}
                >
                  {lifetime[tier]}
                </span>
                <span className="label">{t(tier)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="reveal">
          <div className="label">{t('timeline')}</div>
          <div className="relative mt-4 pl-[1.875rem] before:absolute before:bottom-1.5 before:left-2 before:top-1.5 before:w-[0.09375rem] before:bg-line-strong">
            {p.achievements.map((a) => (
              <div key={a.id} className="relative pb-6 last:pb-1">
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute -left-[1.875rem] top-[0.1875rem] h-[1.0625rem] w-[1.0625rem] rounded-full border-2 bg-card',
                    a.visualTier === 'gold' && 'border-gold bg-gold-bg',
                    a.visualTier === 'silver' && 'border-silver bg-silver-bg',
                    a.visualTier === 'bronze' && 'border-bronze bg-bronze-bg',
                    a.visualTier === 'neutral' && 'border-line-strong'
                  )}
                />
                <div className="font-mono text-2xs tracking-wide text-ink-soft">
                  {a.year}
                </div>
                <div className="mt-0.5 text-sm font-bold">
                  <Link
                    href={`/contests/${a.contestSlug}/${a.year}`}
                    className="hover:text-accent"
                  >
                    {a.editionLabel}
                  </Link>{' '}
                  - {tierLabel(a.resultTier)}{' '}
                  {a.verificationStatus === 'verified' && (
                    <VerifiedBadge label={t('verified')} />
                  )}
                </div>
                <div className="mt-0.5 text-xs text-ink-soft">
                  {[
                    a.location,
                    a.teamName && `Team ${a.teamName}`,
                    a.rank && `rank ${a.rank}`,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                  {a.proofUrl && (
                    <>
                      {' · '}
                      <a
                        href={a.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="text-accent hover:underline"
                      >
                        {t('proof')} ↗
                      </a>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <hr className="my-6 border-line" />

        <div className="reveal">
          <h2 className="text-lg font-extrabold tracking-tight">
            {t('trackRecord')}
          </h2>
          {byCategory.map((group) => (
            <div key={group.label} className="mt-5">
              <div className="label">{group.label}</div>
              <table className="mt-2 w-full">
                <tbody>
                  {group.rows.map((a) => (
                    <tr key={a.id}>
                      <td className="w-16 border-b border-line py-2.5 pr-3 font-mono text-xs text-ink-soft">
                        {a.year}
                      </td>
                      <td className="border-b border-line py-2.5 pr-3 text-body font-bold">
                        <Link
                          href={`/contests/${a.contestSlug}/${a.year}`}
                          className="hover:text-accent"
                        >
                          {a.editionLabel}
                        </Link>
                      </td>
                      <td className="border-b border-line py-2.5 pr-3 text-xs text-ink-soft">
                        {[a.location, a.teamName && `Team ${a.teamName}`]
                          .filter(Boolean)
                          .join(' · ')}
                      </td>
                      <td className="border-b border-line py-2.5 text-right">
                        <MedalToken
                          tier={a.visualTier}
                          word={tierLabel(a.resultTier)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {p.teams.length > 0 && (
          <div className="reveal mt-7">
            <div className="label">{t('teams')}</div>
            <div className="mt-2.5 flex flex-wrap gap-3">
              {p.teams.map((team) => (
                <Link
                  key={team.id}
                  href={`/teams/${team.slug}`}
                  className="rounded-lg bg-wash px-4 py-3 hover:bg-accent-soft"
                >
                  <div className="text-body font-bold">{team.name}</div>
                  <div className="mt-0.5 font-mono text-2xs text-ink-soft">
                    {team.edition?.editionLabel}
                    {team.result?.rank ? ` · #${team.result.rank}` : ''}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const CATEGORY_GROUPS: { label: string; categories: string[] }[] = [
  { label: 'Major individual', categories: ['ioi', 'apio', 'intl_other'] },
  { label: 'ICPC', categories: ['icpc_wf', 'icpc_asia', 'icpc_vn'] },
  { label: 'National', categories: ['voi', 'tst', 'olp'] },
  { label: 'Departmental', categories: ['departmental'] },
]

function groupTrackRecord(p: ProfileExpanded) {
  return CATEGORY_GROUPS.map((g) => ({
    label: g.label,
    rows: p.achievements.filter((a) => g.categories.includes(a.category)),
  })).filter((g) => g.rows.length > 0)
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
function hasTierKey(k: string) {
  return TIER_KEYS.has(k)
}
