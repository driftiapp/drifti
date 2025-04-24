import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { locales } from '@/i18n'
import { Menu, Transition } from '@headlessui/react'
import { GlobeAltIcon } from '@heroicons/react/24/outline'
import { Fragment } from 'react'

const languages = [
  {
    code: 'en',
    label: 'English',
    flag: '🇺🇸',
  },
  {
    code: 'fr',
    label: 'Français',
    flag: '🇫🇷',
  },
  {
    code: 'es',
    label: 'Español',
    flag: '🇪🇸',
  },
  {
    code: 'de',
    label: 'Deutsch',
    flag: '🇩🇪',
  },
  {
    code: 'it',
    label: 'Italiano',
    flag: '🇮🇹',
  },
  {
    code: 'pt',
    label: 'Português',
    flag: '🇵🇹',
  },
  {
    code: 'nl',
    label: 'Nederlands',
    flag: '🇳🇱',
  },
] as const

type Language = typeof languages[number]
type Locale = typeof locales[number]

export default function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = pathname.split('/')[1] as Locale
  const currentLanguage = languages.find(lang => lang.code === currentLocale) || languages[0]

  const handleLocaleChange = (newLocale: Locale) => {
    const newPath = pathname.replace(`/${currentLocale}`, `/${newLocale}`)
    router.push(newPath)
  }

  return (
    <Menu as="div" className="relative inline-block text-left">
      {({ open }: { open: boolean }) => (
        <>
          <Menu.Button className="inline-flex items-center gap-x-1.5 rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-white/20">
            <GlobeAltIcon className="h-5 w-5" aria-hidden="true" />
            <span className="flex items-center gap-2">
              <span>{currentLanguage.flag}</span>
              <span className="hidden sm:inline">{currentLanguage.label}</span>
              <span className="sm:hidden">{currentLanguage.code.toUpperCase()}</span>
            </span>
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                {languages.map((language) => (
                  <Menu.Item key={language.code}>
                    {({ active }: { active: boolean }) => (
                      <button
                        onClick={() => handleLocaleChange(language.code)}
                        className={`${
                          active ? 'bg-gray-100 dark:bg-gray-700' : ''
                        } ${
                          currentLocale === language.code
                            ? 'text-primary font-medium'
                            : 'text-gray-700 dark:text-gray-200'
                        } flex w-full items-center gap-2 px-4 py-2 text-left text-sm`}
                      >
                        <span className="text-lg">{language.flag}</span>
                        <span>{language.label}</span>
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </div>
            </Menu.Items>
          </Transition>
        </>
      )}
    </Menu>
  )
} 