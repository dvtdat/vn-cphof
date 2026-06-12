import type { Metadata } from 'next'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { gotham, plexMono } from '@/lib/fonts'
import { Providers } from '@/components/providers'
import { ScrollReset } from '@/components/scroll-reset'
import { SiteHeader } from '@/components/site-header'
import '../globals.css'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'site' })
  return {
    title: { default: t('title'), template: `%s · ${t('title')}` },
    description: t('description'),
    openGraph: { title: t('title'), description: t('description'), type: 'website' },
    alternates: {
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}`])),
    },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'common' })

  return (
    <html lang={locale}>
      <body className={`${gotham.variable} ${plexMono.variable} flex h-dvh flex-col overflow-hidden`}>
        <NextIntlClientProvider>
          <Providers>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[200] focus:rounded focus:bg-accent focus:px-3 focus:py-2 focus:text-white"
            >
              Skip to content
            </a>
            <SiteHeader />
            <div
              id="app-scroll"
              className="flex flex-1 flex-col overflow-y-auto [scrollbar-gutter:stable]"
            >
              <ScrollReset />
              <main id="main" className="mx-auto w-full max-w-[73.75rem] flex-1 px-6 pb-24 pt-9">
                {children}
              </main>
              <footer className="border-t border-line">
                <div className="mx-auto max-w-[73.75rem] px-6 py-6 font-mono text-2xs text-ink-faint">
                  vn-cphof.com · {t('sampleData')}
                </div>
              </footer>
            </div>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
