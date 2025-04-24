import { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { getMessages } from 'next-intl/server'
import { NextIntlClientProvider } from 'next-intl'
import { notFound } from 'next/navigation'
import { ThemeProvider } from '@/components/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Drifti - Rides & Delivery Platform',
  description: 'Drifti connects drivers, businesses, and customers through an AI-powered platform that makes every journey and delivery smarter, faster, and more efficient.',
}

export default async function RootLayout({
  children,
  params: { lang },
}: {
  children: React.ReactNode
  params: { lang: string }
}) {
  let messages
  try {
    messages = await getMessages()
  } catch (error) {
    notFound()
  }

  return (
    <html lang={lang}>
      <body className={inter.className}>
        <NextIntlClientProvider locale={lang} messages={messages}>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
} 