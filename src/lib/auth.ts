import type { NextAuthConfig } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { Role, AuthSession } from '@/types/auth'
import { AuthErrors, handleAuthError } from './auth-errors'
import { RateLimiter } from './rate-limit'
import { AuthLogger } from './auth-logger'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

const rateLimiter = new RateLimiter(redis, {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  blockDurationMs: 30 * 60 * 1000, // 30 minutes
})

const logger = new AuthLogger(redis)

interface Credentials {
  email: string
  password: string
}

export const authOptions: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            await logger.warn('Invalid credentials: missing email or password')
            throw AuthErrors.INVALID_CREDENTIALS
          }

          const creds = credentials as Credentials

          // Check rate limit
          await rateLimiter.check(creds.email)

          const user = await prisma.user.findUnique({
            where: { email: creds.email }
          })

          if (!user || !user.password) {
            await logger.warn('Invalid credentials: user not found', { email: creds.email })
            throw AuthErrors.INVALID_CREDENTIALS
          }

          const isPasswordValid = await bcrypt.compare(
            creds.password,
            user.password
          )

          if (!isPasswordValid) {
            await logger.warn('Invalid credentials: wrong password', { email: creds.email })
            throw AuthErrors.INVALID_CREDENTIALS
          }

          if (user.twoFactorEnabled && !user.twoFactorVerified) {
            await logger.info('2FA required', { userId: user.id })
            throw AuthErrors.TWO_FACTOR_REQUIRED
          }

          // Reset rate limit on successful login
          await rateLimiter.reset(creds.email)
          await logger.info('User logged in successfully', { userId: user.id })

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role as Role,
          }
        } catch (error) {
          await logger.error('Auth error', { error })
          throw handleAuthError(error)
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async session({ session, token }) {
      try {
        if (token) {
          session.user.id = token.id
          session.user.role = token.role as Role
        }
        return session as AuthSession
      } catch (error) {
        await logger.error('Session error', { error })
        throw handleAuthError(error)
      }
    },
    async jwt({ token, user }) {
      try {
        if (user) {
          token.id = user.id
          token.role = user.role
        }
        return token
      } catch (error) {
        await logger.error('JWT error', { error })
        throw handleAuthError(error)
      }
    }
  }
}

export const auth = () => {
  return authOptions
}
