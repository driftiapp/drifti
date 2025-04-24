'use client'

import { ReactNode, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/hooks/useTheme'

interface ThemeTransitionProps {
  children: ReactNode
}

export function ThemeTransition({ children }: ThemeTransitionProps) {
  const { theme } = useTheme()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={theme}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: 0.3,
          ease: 'easeInOut',
        }}
        className="theme-transition"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
} 