'use client'

import { ReactNode, useEffect } from 'react'
import { useTheme } from '@/hooks/useTheme'

interface ThemeWrapperProps {
  children: ReactNode
  initialTheme?: string
}

export function ThemeWrapper({ children, initialTheme }: ThemeWrapperProps) {
  const { theme } = useTheme()

  useEffect(() => {
    const root = window.document.documentElement
    
    // Remove all theme classes and data attributes
    root.classList.remove('light', 'dark', 'sepia', 'high-contrast', 'rider', 'driver', 'owner')
    root.removeAttribute('data-theme')
    
    // Add current theme class and data attribute
    root.classList.add(theme)
    root.setAttribute('data-theme', theme)
  }, [theme])

  return children
} 