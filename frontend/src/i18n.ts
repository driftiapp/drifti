import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'

// Define supported locales
export const locales = ['en', 'fr', 'es', 'de', 'it', 'pt', 'nl'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale = 'en' as const

// Define domain-specific locales
export const domains = [
  {
    domain: 'driftix.com',
    defaultLocale: 'en',
  },
  {
    domain: 'driftix.fr',
    defaultLocale: 'fr',
  },
  {
    domain: 'driftix.es',
    defaultLocale: 'es',
  },
  {
    domain: 'driftix.de',
    defaultLocale: 'de',
  },
  {
    domain: 'driftix.it',
    defaultLocale: 'it',
  },
  {
    domain: 'driftix.pt',
    defaultLocale: 'pt',
  },
  {
    domain: 'driftix.nl',
    defaultLocale: 'nl',
  },
]

// Configure next-intl
export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) notFound()

  return {
    locale: locale as Locale,
    messages: (await import(`./messages/${locale}.json`)).default
  }
}) 