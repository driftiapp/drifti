import { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { getMessages } from 'next-intl/server'
import { ReactNode, Suspense } from 'react'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from '@/components/ErrorBoundary'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ClientProviders } from '@/components/ClientProviders'
import { ThemeScript } from '@/components/ThemeScript'
import './globals.css'
import { Providers } from '@/components/Providers'
import { Toaster as UiToaster } from '@/components/ui/toaster'
import { AuthProvider } from "@/components/providers/auth-provider"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Drifti - Rides & Delivery Platform',
    template: '%s | Drifti',
  },
  description: 'Drifti connects drivers, businesses, and customers through an AI-powered platform that makes every journey and delivery smarter, faster, and more efficient.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Drifti - Rides & Delivery Platform',
    description: 'Drifti connects drivers, businesses, and customers through an AI-powered platform that makes every journey and delivery smarter, faster, and more efficient.',
    url: '/',
    siteName: 'Drifti',
    locale: 'en_US',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

interface RootLayoutProps {
  children: ReactNode
  params: { locale: string }
}

export default async function RootLayout({
  children,
  params: { locale },
}: RootLayoutProps) {
  const messages = await getMessages({ locale })

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <Providers>
            <ErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                <ClientProviders locale={locale} messages={messages}>
                  {children}
                </ClientProviders>
              </Suspense>
            </ErrorBoundary>
            <Toaster position="top-right" />
            <UiToaster />
          </Providers>
        </AuthProvider>
      </body>
    </html>
  )
} 