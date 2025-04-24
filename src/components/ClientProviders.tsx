'use client'

import { ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { Providers } from './Providers'

interface ClientProvidersProps {
  children: ReactNode
  locale: string
  messages: Record<string, any>
}

export function ClientProviders({ children, locale, messages }: ClientProvidersProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Providers session={null}>
        {children}
      </Providers>
    </NextIntlClientProvider>
  )
} 