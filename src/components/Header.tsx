'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { signIn, signOut, useSession } from 'next-auth/react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import LanguageSwitcher from './LanguageSwitcher'
import { ThemeSwitcher } from './ThemeSwitcher'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const { data: session } = useSession()
  const t = useTranslations('Navigation')

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen)
  }

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Services', href: '/services' },
    { name: 'Contact', href: '/contact' },
  ]

  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">Drifti</span>
            <Image
              className="h-8 w-auto"
              src="/logo.svg"
              alt="Drifti Logo"
              width={32}
              height={32}
            />
          </Link>
        </div>
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 dark:text-gray-200"
            onClick={toggleMenu}
          >
            <span className="sr-only">Open main menu</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
        <div className="hidden lg:flex lg:gap-x-12">
          <Link href="/driver" className="text-sm font-semibold leading-6 text-gray-900 dark:text-white">
            {t('driver')}
          </Link>
          <Link href="/business" className="text-sm font-semibold leading-6 text-gray-900 dark:text-white">
            {t('business')}
          </Link>
          <Link href="/about" className="text-sm font-semibold leading-6 text-gray-900 dark:text-white">
            {t('about')}
          </Link>
        </div>
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4">
          <ThemeSwitcher />
          <LanguageSwitcher />
          <Link href="/login" className="text-sm font-semibold leading-6 text-gray-900 dark:text-white">
            {t('login')} <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </nav>
    </header>
  )
} 