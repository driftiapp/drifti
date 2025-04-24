'use client'

import { useTranslations } from 'next-intl'
import { formatDate } from '@/utils/formatting'
import { useState, type FormEvent, type ChangeEvent } from 'react'

interface FAQItem {
  id: string
  question: string
  answer: string
}

interface CategoryItem {
  id: string
  name: string
}

interface DaySchedule {
  day: string
  hours: string
}

export default function SupportPage() {
  const t = useTranslations('Support')
  const [selectedCategory, setSelectedCategory] = useState('general')
  const [ticketSubmitted, setTicketSubmitted] = useState(false)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Handle ticket submission
    setTicketSubmitted(true)
  }

  const faqItems = t.raw('faq.questions') as FAQItem[]
  const categories = t.raw('contact.form.categories') as CategoryItem[]
  const schedule = t.raw('hours.schedule') as DaySchedule[]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* FAQ Section */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">{t('faq.title')}</h2>
          <div className="space-y-4">
            {faqItems.map((q) => (
              <div key={q.id} className="border rounded-lg p-4">
                <h3 className="font-medium">{q.question}</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">{q.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">{t('contact.title')}</h2>
          {ticketSubmitted ? (
            <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg">
              {t('contact.success')}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block mb-2">{t('contact.form.name')}</label>
                <input
                  id="name"
                  type="text"
                  required
                  aria-label={t('contact.form.name')}
                  className="w-full p-2 border rounded dark:bg-gray-800"
                />
              </div>
              <div>
                <label htmlFor="email" className="block mb-2">{t('contact.form.email')}</label>
                <input
                  id="email"
                  type="email"
                  required
                  aria-label={t('contact.form.email')}
                  className="w-full p-2 border rounded dark:bg-gray-800"
                />
              </div>
              <div>
                <label htmlFor="category" className="block mb-2">{t('contact.form.category')}</label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedCategory(e.target.value)}
                  aria-label={t('contact.form.category')}
                  className="w-full p-2 border rounded dark:bg-gray-800"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="message" className="block mb-2">{t('contact.form.message')}</label>
                <textarea
                  id="message"
                  required
                  rows={4}
                  aria-label={t('contact.form.message')}
                  className="w-full p-2 border rounded dark:bg-gray-800"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {t('contact.form.submit')}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Support Hours */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">{t('hours.title')}</h2>
        <p>{t('hours.description')}</p>
        <div className="mt-4 space-y-2">
          {schedule.map((day) => (
            <div key={day.day} className="flex justify-between">
              <span>{day.day}</span>
              <span>{day.hours}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 