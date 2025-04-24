'use client'

import { useTheme } from '@/context/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Moon, Sun } from 'lucide-react'

export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const buttonRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    const toggleTheme = useCallback(() => {
        setTheme(theme === 'light' ? 'dark' : 'light')
    }, [theme, setTheme])

    if (!mounted) {
        return null
    }

    return (
        <Button
            ref={buttonRef}
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="relative"
        >
            <AnimatePresence mode="wait">
                {theme === 'light' ? (
                    <motion.div
                        key="sun"
                        initial={{ opacity: 0, rotate: -90 }}
                        animate={{ opacity: 1, rotate: 0 }}
                        exit={{ opacity: 0, rotate: 90 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Sun className="h-5 w-5" />
                    </motion.div>
                ) : (
                    <motion.div
                        key="moon"
                        initial={{ opacity: 0, rotate: 90 }}
                        animate={{ opacity: 1, rotate: 0 }}
                        exit={{ opacity: 0, rotate: -90 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Moon className="h-5 w-5" />
                    </motion.div>
                )}
            </AnimatePresence>
        </Button>
    )
} 