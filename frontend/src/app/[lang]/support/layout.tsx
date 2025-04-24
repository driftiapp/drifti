import { createTranslator } from 'next-intl'
import { getLocale } from 'next-intl/server'
import { getLazyMessages } from '@/lib/i18n/lazy-loading'

export default async function SupportLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getLazyMessages(locale, 'Support')
  const t = createTranslator({ locale, messages })

  return (
    <div>
      {children}
    </div>
  )
} 