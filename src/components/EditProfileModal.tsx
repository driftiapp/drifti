'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useTheme } from '@/context/ThemeContext'
import { uploadProfileImage } from '@/lib/storage'
import { toast } from 'react-hot-toast'
import ImageCropper from './ImageCropper'
import DeviceManagement from './DeviceManagement'

interface EditProfileModalProps {
  isOpen: boolean
  onCloseAction: () => void
}

interface UserPreferences {
  bio: string
  language: string
  emailNotifications: boolean
  marketingEmails: boolean
  socialLinks: {
    twitter?: string
    linkedin?: string
    instagram?: string
    facebook?: string
  }
  timezone: string
  contactPreferences: {
    method: 'email' | 'sms' | 'both'
    phoneNumber?: string
    smsNotifications: boolean
    emailNotifications: boolean
  }
  notificationSettings: {
    bookingUpdates: boolean
    eventReminders: boolean
    newMessages: boolean
    specialOffers: boolean
    systemUpdates: boolean
  }
  securitySettings: {
    twoFactorEnabled: boolean
    lastPasswordChange: Date
    loginHistory: {
      date: Date
      device: string
      location: string
    }[]
  }
  privacySettings: {
    profileVisibility: 'public' | 'private' | 'connections'
    activityLogs: boolean
    dataSharing: {
      analytics: boolean
      marketing: boolean
      thirdParty: boolean
    }
  }
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif']
const MAX_BIO_LENGTH = 160
const MIN_IMAGE_DIMENSIONS = { width: 256, height: 256 }
const MAX_IMAGE_DIMENSIONS = { width: 4096, height: 4096 }
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SOCIAL_URL_REGEX = {
  twitter: /^https?:\/\/(?:www\.)?twitter\.com\/[a-zA-Z0-9_]{1,15}$/,
  linkedin: /^https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]{3,100}$/,
  instagram: /^https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9_.]{1,30}$/,
  facebook: /^https?:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9.]{5,}$/
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日本語' },
  { code: 'ar', name: 'العربية' },
]

const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' },
]

const CONTACT_METHODS = [
  { value: 'email', label: 'Email Only' },
  { value: 'sms', label: 'SMS Only' },
  { value: 'both', label: 'Email and SMS' },
]

const PROFILE_VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
  { value: 'connections', label: 'Connections Only' },
]

export default function EditProfileModal({ isOpen, onCloseAction }: EditProfileModalProps) {
  const { data: session, update } = useSession()
  const { theme, toggleTheme } = useTheme()
  const [name, setName] = useState(session?.user?.name || '')
  const [previewImage, setPreviewImage] = useState<string | null>(session?.user?.image || null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [tempImage, setTempImage] = useState<string | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const defaultPreferences: UserPreferences = {
      bio: '',
      language: 'en',
      emailNotifications: true,
      marketingEmails: false,
      socialLinks: {},
      timezone: 'UTC',
      contactPreferences: {
        method: 'email',
        smsNotifications: false,
        emailNotifications: true,
      },
      notificationSettings: {
        bookingUpdates: true,
        eventReminders: true,
        newMessages: true,
        specialOffers: false,
        systemUpdates: true,
      },
      securitySettings: {
        twoFactorEnabled: false,
        lastPasswordChange: new Date(),
        loginHistory: [],
      },
      privacySettings: {
        profileVisibility: 'public',
        activityLogs: true,
        dataSharing: {
          analytics: true,
          marketing: false,
          thirdParty: false,
        },
      },
    };

    // If we have existing preferences in the session, merge them with defaults
    if (session?.user?.preferences) {
      return {
        ...defaultPreferences,
        ...session.user.preferences,
        privacySettings: {
          ...defaultPreferences.privacySettings,
          ...session.user.preferences.privacySettings,
          dataSharing: {
            ...defaultPreferences.privacySettings.dataSharing,
            ...session.user.preferences.privacySettings?.dataSharing,
          },
        },
      };
    }

    return defaultPreferences;
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [show2FASetup, setShow2FASetup] = useState(false)

  const validateImage = async (file: File): Promise<boolean> => {
    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, or GIF)')
      return false
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Image size must be less than 5MB')
      return false
    }

    // Check image dimensions
    try {
      const dimensions = await getImageDimensions(file)
      if (dimensions.width < MIN_IMAGE_DIMENSIONS.width || dimensions.height < MIN_IMAGE_DIMENSIONS.height) {
        toast.error(`Image must be at least ${MIN_IMAGE_DIMENSIONS.width}x${MIN_IMAGE_DIMENSIONS.height} pixels`)
        return false
      }
      if (dimensions.width > MAX_IMAGE_DIMENSIONS.width || dimensions.height > MAX_IMAGE_DIMENSIONS.height) {
        toast.error(`Image must be smaller than ${MAX_IMAGE_DIMENSIONS.width}x${MAX_IMAGE_DIMENSIONS.height} pixels`)
        return false
      }

      // Check image quality
      const quality = await checkImageQuality(file)
      if (quality < 0.7) {
        toast.error('Image quality is too low. Please upload a clearer image.')
        return false
      }
    } catch (error) {
      console.error('Error validating image:', error)
      toast.error('Failed to validate image. Please try again.')
      return false
    }

    return true
  }

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image()
      img.onload = () => {
        resolve({ width: img.width, height: img.height })
      }
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  const checkImageQuality = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const img = new window.Image()
      img.onload = () => {
        // Simple quality check based on image dimensions and file size
        const pixelCount = img.width * img.height
        const bytesPerPixel = file.size / pixelCount
        // Normalize quality score between 0 and 1
        const quality = Math.min(1, bytesPerPixel / 3)
        resolve(quality)
      }
      img.onerror = () => resolve(0)
      img.src = URL.createObjectURL(file)
    })
  }

  const validateBio = (text: string): boolean => {
    // Check for email addresses
    if (EMAIL_REGEX.test(text)) {
      toast.error('Please do not include email addresses in your bio')
      return false
    }

    // Check for URLs (optional)
    const urlRegex = /(https?:\/\/[^\s]+)/g
    if (urlRegex.test(text)) {
      toast.error('Please do not include URLs in your bio')
      return false
    }

    return true
  }

  const validateSocialLink = (platform: keyof typeof SOCIAL_URL_REGEX, url: string): boolean => {
    if (!url) return true // Empty URLs are valid
    if (!SOCIAL_URL_REGEX[platform].test(url)) {
      toast.error(`Please enter a valid ${platform} URL`)
      return false
    }
    return true
  }

  const validatePhoneNumber = (phone: string): boolean => {
    if (!phone) return true // Empty is valid if SMS is not selected
    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    if (!phoneRegex.test(phone)) {
      toast.error('Please enter a valid phone number')
      return false
    }
    return true
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!(await validateImage(file))) {
      fileInputRef.current!.value = ''
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      const imageUrl = reader.result as string
      setTempImage(imageUrl)
      setShowCropper(true)
    }
    reader.readAsDataURL(file)
  }

  const handleCropComplete = async (croppedImage: string) => {
    try {
      setIsLoading(true)
      setUploadProgress(0)
      
      // Convert the cropped image data URL to a File object
      const response = await fetch(croppedImage)
      const blob = await response.blob()
      const file = new File([blob], 'profile-image.jpg', { type: 'image/jpeg' })
      
      // Upload to Firebase Storage with progress tracking
      const downloadURL = await uploadProfileImage(
        file,
        session?.user?.email || 'anonymous',
        (progress) => {
          setUploadProgress(progress)
          toast.loading(`Uploading... ${Math.round(progress)}%`, {
            id: 'upload-progress'
          })
        }
      )
      
      // Update preview with the new URL
      setPreviewImage(downloadURL)
      toast.dismiss('upload-progress')
      toast.success('Profile picture updated successfully!')
    } catch (err) {
      console.error('Error uploading image:', err)
      toast.dismiss('upload-progress')
      toast.error('Failed to upload image. Please try again.')
    } finally {
      setIsLoading(false)
      setUploadProgress(null)
      setShowCropper(false)
      setTempImage(null)
    }
  }

  const handleSocialLinkChange = (platform: keyof typeof SOCIAL_URL_REGEX, value: string) => {
    setPreferences(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validate bio
    if (!validateBio(preferences.bio)) {
      setIsLoading(false)
      return
    }

    // Validate social links
    for (const [platform, url] of Object.entries(preferences.socialLinks)) {
      if (!validateSocialLink(platform as keyof typeof SOCIAL_URL_REGEX, url as string)) {
        setIsLoading(false)
        return
      }
    }

    // Validate phone number if SMS is selected
    if (preferences.contactPreferences.method !== 'email' && 
        !validatePhoneNumber(preferences.contactPreferences.phoneNumber || '')) {
      setIsLoading(false)
      return
    }

    try {
      // Update the session with the new profile data
      await update({
        ...session,
        user: {
          ...session?.user,
          name,
          image: previewImage || session?.user?.image,
          bio: preferences.bio,
          language: preferences.language,
          emailNotifications: preferences.emailNotifications,
          marketingEmails: preferences.marketingEmails,
          socialLinks: preferences.socialLinks,
          timezone: preferences.timezone,
          contactPreferences: preferences.contactPreferences,
          notificationSettings: preferences.notificationSettings,
          securitySettings: preferences.securitySettings,
          privacySettings: preferences.privacySettings,
        },
      })
      toast.success('Profile updated successfully!')
      onCloseAction()
    } catch (err) {
      console.error('Error updating profile:', err)
      toast.error('Failed to update profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = e.target.value as 'light' | 'dark' | 'system'
    if (newTheme !== theme) {
      toggleTheme()
      toast.success(`Theme changed to ${newTheme}`)
    }
  }

  const handlePreferenceChange = (key: keyof UserPreferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }))
  }

  if (!isOpen) return null

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 overflow-y-auto"
        >
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6"
            >
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={onCloseAction}
                  className="bg-white dark:bg-gray-800 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    Edit Profile
                  </h3>
                  <form onSubmit={handleSubmit} className="mt-4 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Profile Picture
                      </label>
                      <div className="mt-2 flex items-center">
                        <div className="relative w-20 h-20 rounded-full overflow-hidden">
                          {previewImage ? (
                            <Image
                              src={previewImage}
                              alt="Profile preview"
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <span className="text-2xl font-medium text-gray-500 dark:text-gray-400">
                                {name[0]?.toUpperCase() || 'U'}
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="ml-4 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Change
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Bio
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="bio"
                          rows={3}
                          maxLength={MAX_BIO_LENGTH}
                          value={preferences.bio}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handlePreferenceChange('bio', e.target.value)}
                          className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                          placeholder="Tell us about yourself..."
                        />
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {preferences.bio.length}/{MAX_BIO_LENGTH} characters
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Language
                      </label>
                      <select
                        value={preferences.language}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handlePreferenceChange('language', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      >
                        {LANGUAGES.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Theme
                      </label>
                      <select
                        value={theme}
                        onChange={handleThemeChange}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System</option>
                      </select>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email Preferences
                      </h4>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="emailNotifications"
                          checked={preferences.emailNotifications}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePreferenceChange('emailNotifications', e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                          Receive email notifications
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="marketingEmails"
                          checked={preferences.marketingEmails}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePreferenceChange('marketingEmails', e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="marketingEmails" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                          Receive marketing emails
                        </label>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Social Links
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label htmlFor="twitter" className="block text-sm text-gray-700 dark:text-gray-300">
                            Twitter
                          </label>
                          <input
                            type="url"
                            id="twitter"
                            value={preferences.socialLinks.twitter || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSocialLinkChange('twitter', e.target.value)}
                            placeholder="https://twitter.com/username"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="linkedin" className="block text-sm text-gray-700 dark:text-gray-300">
                            LinkedIn
                          </label>
                          <input
                            type="url"
                            id="linkedin"
                            value={preferences.socialLinks.linkedin || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSocialLinkChange('linkedin', e.target.value)}
                            placeholder="https://linkedin.com/in/username"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="instagram" className="block text-sm text-gray-700 dark:text-gray-300">
                            Instagram
                          </label>
                          <input
                            type="url"
                            id="instagram"
                            value={preferences.socialLinks.instagram || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSocialLinkChange('instagram', e.target.value)}
                            placeholder="https://instagram.com/username"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="facebook" className="block text-sm text-gray-700 dark:text-gray-300">
                            Facebook
                          </label>
                          <input
                            type="url"
                            id="facebook"
                            value={preferences.socialLinks.facebook || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSocialLinkChange('facebook', e.target.value)}
                            placeholder="https://facebook.com/username"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Timezone
                      </label>
                      <select
                        value={preferences.timezone}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handlePreferenceChange('timezone', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      >
                        {TIMEZONES.map((tz) => (
                          <option key={tz.value} value={tz.value}>
                            {tz.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Contact Preferences
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-gray-700 dark:text-gray-300">
                            Preferred Contact Method
                          </label>
                          <select
                            value={preferences.contactPreferences.method}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                              handlePreferenceChange('contactPreferences', {
                                ...preferences.contactPreferences,
                                method: e.target.value as 'email' | 'sms' | 'both'
                              })
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                          >
                            {CONTACT_METHODS.map((method) => (
                              <option key={method.value} value={method.value}>
                                {method.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        {preferences.contactPreferences.method !== 'email' && (
                          <div>
                            <label htmlFor="phoneNumber" className="block text-sm text-gray-700 dark:text-gray-300">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              id="phoneNumber"
                              value={preferences.contactPreferences.phoneNumber || ''}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                handlePreferenceChange('contactPreferences', {
                                  ...preferences.contactPreferences,
                                  phoneNumber: e.target.value
                                })
                              }
                              placeholder="+1234567890"
                              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Notification Settings
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="bookingUpdates"
                            checked={preferences.notificationSettings.bookingUpdates}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                              handlePreferenceChange('notificationSettings', {
                                ...preferences.notificationSettings,
                                bookingUpdates: e.target.checked
                              })
                            }
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <label htmlFor="bookingUpdates" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            Booking Updates
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="eventReminders"
                            checked={preferences.notificationSettings.eventReminders}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                              handlePreferenceChange('notificationSettings', {
                                ...preferences.notificationSettings,
                                eventReminders: e.target.checked
                              })
                            }
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <label htmlFor="eventReminders" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            Event Reminders
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="newMessages"
                            checked={preferences.notificationSettings.newMessages}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                              handlePreferenceChange('notificationSettings', {
                                ...preferences.notificationSettings,
                                newMessages: e.target.checked
                              })
                            }
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <label htmlFor="newMessages" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            New Messages
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="specialOffers"
                            checked={preferences.notificationSettings.specialOffers}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                              handlePreferenceChange('notificationSettings', {
                                ...preferences.notificationSettings,
                                specialOffers: e.target.checked
                              })
                            }
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <label htmlFor="specialOffers" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            Special Offers
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="systemUpdates"
                            checked={preferences.notificationSettings.systemUpdates}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                              handlePreferenceChange('notificationSettings', {
                                ...preferences.notificationSettings,
                                systemUpdates: e.target.checked
                              })
                            }
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <label htmlFor="systemUpdates" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            System Updates
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Security Settings
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Two-Factor Authentication
                            </h5>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Add an extra layer of security to your account
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShow2FASetup(true)}
                            className={`px-4 py-2 rounded-md text-sm font-medium ${
                              preferences.securitySettings.twoFactorEnabled
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            }`}
                          >
                            {preferences.securitySettings.twoFactorEnabled ? 'Enabled' : 'Enable'}
                          </button>
                        </div>

                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                          <DeviceManagement />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Privacy Settings
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-gray-700 dark:text-gray-300">
                            Profile Visibility
                          </label>
                          <select
                            value={preferences.privacySettings.profileVisibility}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                              handlePreferenceChange('privacySettings', {
                                ...preferences.privacySettings,
                                profileVisibility: e.target.value as 'public' | 'private' | 'connections'
                              })
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                          >
                            {PROFILE_VISIBILITY_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="activityLogs"
                            checked={preferences.privacySettings.activityLogs}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                              handlePreferenceChange('privacySettings', {
                                ...preferences.privacySettings,
                                activityLogs: e.target.checked
                              })
                            }
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <label htmlFor="activityLogs" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            Enable Activity Logs
                          </label>
                        </div>

                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Data Sharing Preferences
                          </h5>
                          <div className="space-y-3">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="analytics"
                                checked={preferences.privacySettings.dataSharing.analytics}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                  handlePreferenceChange('privacySettings', {
                                    ...preferences.privacySettings,
                                    dataSharing: {
                                      ...preferences.privacySettings.dataSharing,
                                      analytics: e.target.checked
                                    }
                                  })
                                }
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                              <label htmlFor="analytics" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                Share Analytics Data
                              </label>
                            </div>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="marketing"
                                checked={preferences.privacySettings.dataSharing.marketing}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                  handlePreferenceChange('privacySettings', {
                                    ...preferences.privacySettings,
                                    dataSharing: {
                                      ...preferences.privacySettings.dataSharing,
                                      marketing: e.target.checked
                                    }
                                  })
                                }
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                              <label htmlFor="marketing" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                Share Data for Marketing
                              </label>
                            </div>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="thirdParty"
                                checked={preferences.privacySettings.dataSharing.thirdParty}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                  handlePreferenceChange('privacySettings', {
                                    ...preferences.privacySettings,
                                    dataSharing: {
                                      ...preferences.privacySettings.dataSharing,
                                      thirdParty: e.target.checked
                                    }
                                  })
                                }
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                              <label htmlFor="thirdParty" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                Share Data with Third Parties
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {error && (
                      <div className="text-red-600 dark:text-red-400 text-sm">
                        {error}
                      </div>
                    )}

                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={onCloseAction}
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {showCropper && previewImage && (
        <ImageCropper
          image={previewImage}
          onCropCompleteAction={handleCropComplete}
          onCloseAction={() => setShowCropper(false)}
        />
      )}

      {show2FASetup && (
        <div className="mt-4">
          <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
          <p className="text-sm text-gray-500">Coming soon...</p>
        </div>
      )}
    </>
  )
} 