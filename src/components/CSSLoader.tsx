'use client'

import { useEffect } from 'react'

export function CSSLoader() {
  useEffect(() => {
    // Only preload if the CSS hasn't been loaded yet
    if (!document.querySelector('link[href*="layout.css"]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = '/_next/static/css/app/layout.css'
      document.head.appendChild(link)
    }

    return () => {
      const link = document.querySelector('link[href*="layout.css"]')
      if (link) {
        document.head.removeChild(link)
      }
    }
  }, [])

  return null
} 