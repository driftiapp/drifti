'use client'

import React, { ReactNode, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type NotificationType = 'success' | 'error' | 'warning' | 'info'

interface NotificationProps {
    id?: number
    type: NotificationType
    message: string
    duration?: number
    onClose: () => void
}

const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
}

const styles = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
}

export function Notification({ type, message, duration = 5000, onClose }: NotificationProps) {
    const [isVisible, setIsVisible] = useState(true)
    const Icon = icons[type]

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false)
            setTimeout(onClose, 300) // Wait for fade out animation
        }, duration)

        return () => clearTimeout(timer)
    }, [duration, onClose])

    return createPortal(
        <div
            className={cn(
                'fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border p-4 shadow-lg transition-all duration-300',
                styles[type],
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
            )}
            role="alert"
        >
            <Icon className="h-5 w-5" />
            <p className="text-sm font-medium">{message}</p>
        </div>,
        document.body
    )
}

interface NotificationContextType {
    showNotification: (props: Omit<NotificationProps, 'onClose'>) => void
}

export const NotificationContext = React.createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<NotificationProps[]>([])

    const showNotification = (props: Omit<NotificationProps, 'onClose'>) => {
        const id = Date.now()
        setNotifications((prev) => [
            ...prev,
            { ...props, id, onClose: () => setNotifications((prev) => prev.filter((n) => n.id !== id)) },
        ])
    }

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            {notifications.map((notification) => (
                <Notification key={notification.id} {...notification} />
            ))}
        </NotificationContext.Provider>
    )
} 