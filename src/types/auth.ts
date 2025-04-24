import type { DefaultSession } from 'next-auth'
import type { JWT as DefaultJWT } from 'next-auth/jwt'

export enum Role {
    USER = "USER",
    ADMIN = "ADMIN",
    BUSINESS_OWNER = "BUSINESS_OWNER",
    DRIVER = "DRIVER",
    CUSTOMER_SUPPORT = "CUSTOMER_SUPPORT"
}

declare module 'next-auth' {
    interface Session extends DefaultSession {
        user: {
            id: string
            role: Role
        } & DefaultSession['user']
    }

    interface User {
        id: string
        email: string
        name?: string | null
        role: Role
        image?: string | null
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string
        role: Role
    }
}

export interface AuthSession {
    user: {
        id: string
        email: string
        name?: string | null
        role: Role
        image?: string | null
    }
    expires: string
} 