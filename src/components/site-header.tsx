import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { LocaleSwitcher } from './locale-switcher'
import { LogoSubtract } from './logo'

export function SiteHeader() {
  const t = useTranslations()
  return (
    <header className="bg-accent text-white">
      <div className="mx-auto flex max-w-[73.75rem] items-center gap-7 px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <LogoSubtract size={38} className="flex-none" />
          <span className="flex flex-col gap-px">
            <span className="whitespace-nowrap font-mono text-3xs uppercase tracking-[0.1375rem] text-white/70">
              {t('site.topline')}
            </span>
            <span className="whitespace-nowrap text-md font-extrabold uppercase leading-tight tracking-tight text-white">
              {t('site.name')}
            </span>
          </span>
        </Link>

        <nav aria-label="Primary" className="ml-2 flex gap-1">
          <NavLink href="/contests">{t('nav.contests')}</NavLink>
          <NavLink href="/departments">{t('nav.departments')}</NavLink>
          <NavLink href="/organizations">{t('nav.organizations')}</NavLink>
          <NavLink href="/about">{t('nav.about')}</NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-3.5">
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  )
}

function NavLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="rounded-[0.3125rem] px-2.5 py-1.5 text-body font-semibold text-white/75 hover:bg-white/10 hover:text-white"
    >
      {children}
    </Link>
  )
}
