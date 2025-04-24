'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import EditProfileModal from '@/components/EditProfileModal'
import Image from 'next/image'

export default function Profile() {
  const { data: session, status } = useSession()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-300 dark:bg-gray-600 h-12 w-12"></div>
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Please sign in to view your profile
          </h2>
          <button
            onClick={() => signIn('google')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden"
          >
            {/* Profile Header */}
            <div className="px-6 py-8 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-6">
                <Image
                  src={session.user.image || '/default-avatar.png'}
                  alt={session.user.name || 'Profile picture'}
                  width={96}
                  height={96}
                  className="rounded-full"
                />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {session.user?.name}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    {session.user?.email}
                  </p>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                      Member
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="ml-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Profile Content */}
            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Account Settings */}
                <div className="space-y-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Account Settings
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Display Name
                      </label>
                      <input
                        type="text"
                        defaultValue={session.user?.name || ''}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email
                      </label>
                      <input
                        type="email"
                        defaultValue={session.user?.email || ''}
                        disabled
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm opacity-50 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Connected Accounts */}
                <div className="space-y-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Connected Accounts
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-600 flex items-center justify-center">
                          <svg
                            className="h-5 w-5 text-gray-600 dark:text-gray-300"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12.545,12.151L12.545,12.151c0,1.054,0.855,1.909,1.909,1.909h3.536c-0.624,2.699-2.731,4.728-5.445,4.728 c-3.073,0-5.566-2.493-5.566-5.566s2.493-5.566,5.566-5.566c1.498,0,2.866,0.579,3.893,1.523l0.051,0.047l-2.47,2.47 c-0.553-0.522-1.33-0.835-2.175-0.835c-1.8,0-3.26,1.46-3.26,3.26s1.46,3.26,3.26,3.26c1.8,0,3.26-1.46,3.26-3.26 c0-0.178-0.014-0.353-0.041-0.525h-3.219V12.151z" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Google
                        </span>
                      </div>
                      <span className="text-sm text-green-600 dark:text-green-400">
                        Connected
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <h2 className="text-lg font-medium text-red-600 dark:text-red-400">
                  Danger Zone
                </h2>
                <div className="mt-4">
                  <button
                    onClick={() => signOut()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onCloseAction={() => setIsEditModalOpen(false)}
      />
    </div>
  )
} 