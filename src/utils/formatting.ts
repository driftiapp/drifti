export const formatDate = (date: Date, locale: string): string => {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

export const formatTime = (date: Date, locale: string): string => {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

export const formatCurrency = (amount: number, locale: string, currency: string): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount)
}

export const formatNumber = (number: number, locale: string): string => {
  return new Intl.NumberFormat(locale).format(number)
}

export const formatRelativeTime = (date: Date, locale: string): string => {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
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
  return new Intl.RelativeTimeFormat(locale, { style: 'short' }).format(-diffInDays, 'day')
} 