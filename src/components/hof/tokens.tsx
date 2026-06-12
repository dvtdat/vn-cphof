import { Link } from '@/i18n/navigation'
import type { ProfileSummary, VisualTier } from '@/lib/api/schemas'
import { hashIndex, initials } from '@/lib/text'
import { cn } from '@/lib/utils'

const MEDAL_STYLES: Record<VisualTier, { text: string; pip: string }> = {
  gold: { text: 'text-gold', pip: 'border-gold text-gold bg-gold-bg' },
  silver: {
    text: 'text-silver',
    pip: 'border-silver text-silver bg-silver-bg',
  },
  bronze: {
    text: 'text-bronze',
    pip: 'border-bronze text-bronze bg-bronze-bg',
  },
  neutral: {
    text: 'text-ink-soft',
    pip: 'border-line-strong text-ink-soft bg-paper',
  },
}
const MEDAL_LETTER: Record<VisualTier, string> = {
  gold: 'G',
  silver: 'S',
  bronze: 'B',
  neutral: '·',
}

export function MedalToken({
  tier,
  count,
  word,
  title,
}: {
  tier: VisualTier
  count?: number
  word?: string
  title?: string
}) {
  const s = MEDAL_STYLES[tier]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono text-xs font-semibold',
        s.text
      )}
      title={title}
    >
      <span
        aria-hidden="true"
        className={cn(
          'inline-flex h-[1.0625rem] w-[1.0625rem] items-center justify-center rounded-full border-[0.09375rem] text-3xs font-semibold',
          s.pip
        )}
      >
        {MEDAL_LETTER[tier]}
      </span>
      {count ?? word}
    </span>
  )
}

export function MedalCluster({
  summary,
}: {
  summary: { visualTier: VisualTier; count: number }[]
}) {
  if (!summary.length)
    return <span className="font-mono text-xs text-ink-faint">-</span>
  return (
    <span className="inline-flex items-center gap-2.5">
      {summary.map((m) => (
        <MedalToken key={m.visualTier} tier={m.visualTier} count={m.count} />
      ))}
    </span>
  )
}

// Same lightness/chroma logic as the palette ramps (globals.css); chroma
// dips on hues that clip sRGB at this lightness. All ≥4.5:1 vs paper.
const DOT_COLORS = [
  'oklch(55% 0.12 28)',
  'oklch(55% 0.12 60)',
  'oklch(55% 0.11 86)',
  'oklch(55% 0.12 110)',
  'oklch(55% 0.12 148)',
  'oklch(55% 0.09 200)',
  'oklch(55% 0.12 256)',
  'oklch(55% 0.12 310)',
  'oklch(55% 0.12 340)',
]

export function DeptTag({ code, name }: { code?: string; name?: string }) {
  if (!name) return null
  const dot = DOT_COLORS[hashIndex(code ?? name, DOT_COLORS.length)]
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[0.3125rem] bg-wash px-2 py-1 text-xs font-medium text-ink">
      <span
        aria-hidden="true"
        className="h-2 w-2 rounded-[0.125rem]"
        style={{ background: dot }}
      />
      {name}
    </span>
  )
}

// Quieter than dots (lower chroma, L 50%) - white initials hold ≥4.5:1 on all.
const AVATAR_COLORS = [
  'oklch(50% 0.1 28)',
  'oklch(50% 0.1 60)',
  'oklch(50% 0.1 86)',
  'oklch(50% 0.1 148)',
  'oklch(50% 0.08 200)',
  'oklch(50% 0.1 256)',
  'oklch(50% 0.1 310)',
  'oklch(50% 0.1 340)',
]

export function Avatar({
  name,
  id,
  size = 'sm',
}: {
  name: string
  id: string
  size?: 'sm' | 'lg'
}) {
  const bg = AVATAR_COLORS[hashIndex(id, AVATAR_COLORS.length)]
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex flex-none items-center justify-center font-bold tracking-wide text-white',
        size === 'sm'
          ? 'h-[2.375rem] w-[2.375rem] rounded-full text-xs'
          : 'h-[6.75rem] w-[6.75rem] rounded-[0.625rem] text-3xl'
      )}
      style={{ background: bg }}
    >
      {initials(name)}
    </span>
  )
}

export function PersonCell({ profile }: { profile: ProfileSummary }) {
  return (
    <span className="flex items-center gap-3">
      <Avatar name={profile.fullName} id={profile.id} />
      <span>
        <span className="block text-sm font-bold leading-tight">
          {profile.fullName}
        </span>
        {profile.displayHandle && (
          <span className="mt-0.5 block font-mono text-2xs text-ink-soft">
            @{profile.displayHandle}
          </span>
        )}
      </span>
    </span>
  )
}

export function VerifiedBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-accent-soft px-2 py-0.5 font-mono text-2xs text-accent">
      ✓ {label}
    </span>
  )
}

export function StatCard({
  value,
  label,
  accent,
}: {
  value: string | number
  label: string
  accent?: boolean
}) {
  return (
    <div className="min-w-[7.25rem] rounded-lg bg-wash px-4 py-3.5">
      <div
        className={cn(
          'text-stat font-extrabold leading-none tabular-nums',
          accent && 'text-accent'
        )}
      >
        {value}
      </div>
      <div className="label mt-1.5">{label}</div>
    </div>
  )
}

const PLATFORM_GLYPH: Record<string, { label: string; bg: string }> = {
  codeforces: { label: 'CF', bg: '#B23A48' },
  atcoder: { label: 'AC', bg: '#555555' },
  vnoj: { label: 'VN', bg: '#2E6E8E' },
  topcoder: { label: 'TC', bg: '#7C6A8E' },
  codechef: { label: 'CC', bg: '#8A7A4E' },
  github: { label: 'GH', bg: '#333333' },
  other: { label: '↗', bg: '#777777' },
}

export function AccountChip({
  platform,
  handle,
  url,
}: {
  platform: string
  handle: string
  url: string
}) {
  const g = PLATFORM_GLYPH[platform] ?? PLATFORM_GLYPH.other
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="inline-flex items-center gap-1.5 rounded-md bg-wash px-2 py-1 font-mono text-2xs text-ink-soft hover:bg-accent-soft hover:text-accent"
    >
      <span
        aria-hidden="true"
        className="flex h-[0.9375rem] w-[0.9375rem] flex-none items-center justify-center rounded text-3xs font-semibold text-white"
        style={{ background: g.bg }}
      >
        {g.label}
      </span>
      {handle}
    </a>
  )
}

export function CountryFlag({
  countryCode,
  label,
  size = 20,
}: {
  countryCode: string
  label?: string
  size?: number // width in px; height keeps the 3:2-ish ratio
}) {
  const height = Math.round(size * 0.7)
  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny static svg, next/image overhead not worth it
    <img
      src={`/flags/${countryCode.toUpperCase()}.svg`}
      alt={label ?? countryCode.toUpperCase()}
      width={size}
      height={height}
      className="inline-block flex-none rounded-[0.125rem] border border-line object-cover"
      style={{ width: size, height }}
    />
  )
}

export function OrgLogo({
  name,
  shortName,
  logoUrl,
  size = 18,
}: {
  name: string
  shortName?: string
  logoUrl?: string
  size?: number
}) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- tiny org mark
      <img
        src={logoUrl}
        alt={name}
        width={size}
        height={size}
        className="inline-block rounded-[0.25rem] border border-line object-contain"
        style={{ width: size, height: size }}
      />
    )
  }
  const bg = AVATAR_COLORS[hashIndex(name, AVATAR_COLORS.length)]
  return (
    <span
      title={name}
      className="inline-flex flex-none items-center justify-center rounded-[0.25rem] font-bold text-white"
      style={{
        width: size,
        height: size,
        background: bg,
        fontSize: size * 0.42,
      }}
    >
      {initials(shortName ?? name)}
    </span>
  )
}

export function Seal({ code }: { code: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-[5.25rem] w-[5.25rem] flex-none flex-col items-center justify-center gap-0.5 rounded-full border-2 border-accent bg-accent-softer text-accent"
    >
      <span className="text-3xs">✶</span>
      <span className="text-2xl font-extrabold tracking-wide">
        {code.slice(0, 2).toUpperCase()}
      </span>
    </span>
  )
}

export function RankNum({ rank, top3 }: { rank: number; top3?: boolean }) {
  return (
    <span
      className={cn(
        'text-base font-extrabold tabular-nums',
        top3 && 'text-accent'
      )}
    >
      {rank}
    </span>
  )
}

export function PersonLink({ profile }: { profile: ProfileSummary }) {
  return (
    <Link href={`/p/${profile.slug}`} className="hover:text-accent">
      <PersonCell profile={profile} />
    </Link>
  )
}
