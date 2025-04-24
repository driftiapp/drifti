'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useToast } from '@/components/ui/use-toast'

interface ThemeShareProps {
  theme: {
    name: string
    colors: {
      primary: string
      secondary: string
      background: string
      text: string
      border: string
    }
  }
}

export function ThemeShare({ theme }: ThemeShareProps) {
  const [isSharing, setIsSharing] = useState(false)
  const [shareCode, setShareCode] = useState<string | null>(null)
  const { toast } = useToast()

  const handleShare = async () => {
    setIsSharing(true)
    try {
      const response = await fetch('/api/themes/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(theme),
      })

      if (!response.ok) throw new Error('Failed to share theme')

      const data = await response.json()
      setShareCode(data.shareCode)

      // Copy share link to clipboard
      const shareLink = `${window.location.origin}/themes?code=${data.shareCode}`
      await navigator.clipboard.writeText(shareLink)

      toast({
        title: 'Theme Shared!',
        description: 'Share link copied to clipboard',
      })
    } catch (error) {
      console.error('Error sharing theme:', error)
      toast({
        title: 'Error',
        description: 'Failed to share theme',
        variant: 'destructive',
      })
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <div className="space-y-4">
      <motion.button
        onClick={handleShare}
        disabled={isSharing}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full px-4 py-2 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50"
        aria-label="Share theme"
      >
        {isSharing ? 'Sharing...' : 'Share Theme'}
      </motion.button>

      {shareCode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg border border-[var(--border)] bg-[var(--background)]"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Share Code:</p>
              <p className="text-2xl font-bold">{shareCode}</p>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(shareCode)}
              className="px-3 py-1 rounded-lg text-sm bg-[var(--secondary)] text-[var(--text)] hover:bg-[var(--secondary)]/90"
              aria-label="Copy share code"
            >
              Copy
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
} 