'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'

interface HeroImageProps {
  className?: string
}

export default function HeroImage({ className = '' }: HeroImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const img = new window.Image()
    img.src = '/images/hero-platform.png'
    img.onload = () => setIsLoading(false)
    img.onerror = () => setError(true)
  }, [])

  if (error) {
    return (
      <div className={`relative w-full h-[400px] bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-primary/60 text-lg">Failed to load hero image</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={`relative w-full h-[400px] bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative w-full h-[400px] rounded-lg overflow-hidden ${className}`}
    >
      <Image
        src="/images/hero-platform.png"
        alt="Drifti Platform Preview"
        fill
        className="object-cover"
        priority
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
    </motion.div>
  )
} 