'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTheme, loadUserTheme, syncThemeWithBackend } from '@/store/useTheme'
import { ThemeContextProvider } from '@/context/ThemeContext'

interface ThemeProviderProps {
    children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const { data: session } = useSession()
    const { theme } = useTheme()

    useEffect(() => {
        if (session?.user) {
            loadUserTheme()
        }
    }, [session])

    useEffect(() => {
        if (session?.user) {
            syncThemeWithBackend(theme)
        }
    }, [theme, session])

    return (
        <ThemeContextProvider>
            {children}
        </ThemeContextProvider>
    )
} 