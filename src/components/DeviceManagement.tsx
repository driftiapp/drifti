'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'

interface Device {
  id: string
  name: string
  type: string
  lastActive: Date
  location: string
  isCurrent: boolean
}

interface Session {
  id: string
  device: Device
  ipAddress: string
  userAgent: string
  createdAt: Date
  lastActive: Date
}

export default function DeviceManagement() {
  const { data: session, update } = useSession()
  const [devices, setDevices] = useState<Device[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDevices()
    fetchSessions()
  }, [])

  const fetchDevices = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/auth/devices')
      const data = await response.json()
      setDevices(data.devices)
    } catch (error) {
      console.error('Error fetching devices:', error)
      toast.error('Failed to fetch devices')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSessions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/auth/sessions')
      const data = await response.json()
      setSessions(data.sessions)
    } catch (error) {
      console.error('Error fetching sessions:', error)
      toast.error('Failed to fetch sessions')
    } finally {
      setIsLoading(false)
    }
  }

  const revokeDevice = async (deviceId: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/auth/devices/${deviceId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        toast.success('Device revoked successfully')
        fetchDevices()
        fetchSessions()
      } else {
        throw new Error('Failed to revoke device')
      }
    } catch (error) {
      console.error('Error revoking device:', error)
      toast.error('Failed to revoke device')
    } finally {
      setIsLoading(false)
    }
  }

  const revokeSession = async (sessionId: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/auth/sessions/${sessionId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        toast.success('Session revoked successfully')
        fetchSessions()
      } else {
        throw new Error('Failed to revoke session')
      }
    } catch (error) {
      console.error('Error revoking session:', error)
      toast.error('Failed to revoke session')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Active Devices
        </h3>
        <div className="mt-4 space-y-4">
          {devices.map((device) => (
            <motion.div
              key={device.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
            >
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {device.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {device.type} • {device.location}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Last active: {new Date(device.lastActive).toLocaleString()}
                </p>
              </div>
              {!device.isCurrent && (
                <button
                  onClick={() => revokeDevice(device.id)}
                  disabled={isLoading}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                >
                  Revoke
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Active Sessions
        </h3>
        <div className="mt-4 space-y-4">
          {sessions.map((session) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
            >
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {session.device.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {session.ipAddress} • {session.userAgent}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Started: {new Date(session.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => revokeSession(session.id)}
                disabled={isLoading}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
              >
                End Session
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
} 