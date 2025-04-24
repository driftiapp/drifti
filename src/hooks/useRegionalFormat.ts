import { useLocale } from 'next-intl'

interface RegionalFormatOptions {
  currency?: string
  dateStyle?: 'full' | 'long' | 'medium' | 'short'
  timeStyle?: 'full' | 'long' | 'medium' | 'short'
}

export function useRegionalFormat(options: RegionalFormatOptions = {}) {
  const locale = useLocale()
  const { currency = 'USD', dateStyle = 'medium', timeStyle = 'short' } = options

  const formatDate = (date: Date | string | number) => {
    const dateObj = new Date(date)
    return new Intl.DateTimeFormat(locale, {
      dateStyle,
      timeStyle,
    }).format(dateObj)
  }

  const formatTime = (date: Date | string | number) => {
    const dateObj = new Date(date)
    return new Intl.DateTimeFormat(locale, {
      timeStyle,
    }).format(dateObj)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(amount)
  }

  const formatNumber = (number: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(locale, options).format(number)
  }

  const formatRelativeTime = (date: Date | string | number) => {
    const dateObj = new Date(date)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return new Intl.RelativeTimeFormat(locale, { style: 'short' }).format(-diffInSeconds, 'second')
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
      return new Intl.RelativeTimeFormat(locale, { style: 'short' }).format(-diffInMinutes, 'minute')
    }

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
      return new Intl.RelativeTimeFormat(locale, { style: 'short' }).format(-diffInHours, 'hour')
    }

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 30) {
      return new Intl.RelativeTimeFormat(locale, { style: 'short' }).format(-diffInDays, 'day')
    }

    const diffInMonths = Math.floor(diffInDays / 30)
    if (diffInMonths < 12) {
      return new Intl.RelativeTimeFormat(locale, { style: 'short' }).format(-diffInMonths, 'month')
    }

    const diffInYears = Math.floor(diffInMonths / 12)
    return new Intl.RelativeTimeFormat(locale, { style: 'short' }).format(-diffInYears, 'year')
  }

  return {
    formatDate,
    formatTime,
    formatCurrency,
    formatNumber,
    formatRelativeTime,
  }
} 