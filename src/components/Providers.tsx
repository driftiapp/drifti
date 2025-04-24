'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeWrapper } from './ThemeWrapper'
import { Session } from 'next-auth'

interface ProvidersProps {
  children: React.ReactNode
  session?: Session | null
}

export function Providers({ children, session }: ProvidersProps) {
  return (
    <SessionProvider session={session}>
      <ThemeWrapper>
        {children}
      </ThemeWrapper>
    </SessionProvider>
  )
}