import { cache } from 'react'
import { getMessages } from 'next-intl/server'

// Cache translations for 1 hour
const CACHE_DURATION = 60 * 60 * 1000
const translationCache = new Map<string, { data: any; timestamp: number }>()

export const getLazyMessages = cache(async (locale: string, namespace?: string) => {
  const cacheKey = namespace ? `${locale}-${namespace}` : locale
  const cached = translationCache.get(cacheKey)

  // Return cached translations if they exist and are not expired
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }

  try {
    // Load all messages first
    const allMessages = await getMessages()
    
    // If namespace is specified, only return that namespace
    const messages = namespace ? { [namespace]: allMessages[namespace] } : allMessages

    // Cache the result
    translationCache.set(cacheKey, {
      data: messages,
      timestamp: Date.now()
    })

    return messages
  } catch (error) {
    console.error('Error loading translations:', error)
    return {}
  }
})

// Clear cache function for development purposes
export const clearTranslationCache = () => {
  translationCache.clear()
} 