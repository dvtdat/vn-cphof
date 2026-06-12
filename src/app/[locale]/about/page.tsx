import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })
  return { title: t('title') }
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'about' })

  return (
    <div className="max-w-[45rem]">
      <h1 className="reveal text-3xl font-extrabold leading-tight tracking-tight">
        {t('title')}
      </h1>
      <p className="reveal mt-4 text-sm leading-relaxed text-ink-soft">{t('intro')}</p>

      
      <section className="reveal mt-8">
        <h2 className="text-lg font-extrabold tracking-tight">{t('dataTitle')}</h2>
        <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">{t('data')}</p>
      </section>

      <section className="reveal mt-8">
        <h2 className="text-lg font-extrabold tracking-tight">{t('creditsTitle')}</h2>
        <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">{t('credits')}</p>
      </section>
    </div>
  )
}
