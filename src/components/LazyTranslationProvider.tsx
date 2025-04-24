import { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { getLazyMessages } from '@/lib/i18n/lazy-loading'

interface LazyTranslationProviderProps {
  children: ReactNode
  locale: string
  namespace?: string
  messages: any
}

export function LazyTranslationProvider({
  children,
  locale,
  namespace,
  messages,
}: LazyTranslationProviderProps) {
  const t = useTranslations(namespace)

  return (
    <>
      {children}
    </>
  )
}

export async function getLazyTranslationProps(locale: string, namespace?: string) {
  const messages = await getLazyMessages(locale, namespace)
  return { messages }
} 