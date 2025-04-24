import { Role } from "./auth"
import NextAuth from "next-auth"

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

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            name?: string | null
            email?: string | null
            image?: string | null
            role: Role
            preferences?: UserPreferences
        }
    }

    interface User {
        id: string
        name?: string | null
        email?: string | null
        image?: string | null
        role: Role
        preferences?: UserPreferences
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        role: Role
        preferences?: UserPreferences
    }
} 