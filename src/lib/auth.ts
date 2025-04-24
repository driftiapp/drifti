import { PrismaAdapter } from "@auth/prisma-adapter"
import type { DefaultSession, NextAuthConfig, User } from "next-auth"
import { db } from "@/lib/db"
import { env } from "@/lib/env"
import { compare } from "bcrypt"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import TwitterProvider from "next-auth/providers/twitter"
import FacebookProvider from "next-auth/providers/facebook"
import { Role } from "@/types/auth"
import NextAuth from "next-auth"

export const authOptions: NextAuthConfig = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
    newUser: "/auth/register"
  },
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    GitHubProvider({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "read:user user:email"
        }
      }
    }),
    TwitterProvider({
      clientId: env.TWITTER_CLIENT_ID,
      clientSecret: env.TWITTER_CLIENT_SECRET,
    }),
    FacebookProvider({
      clientId: env.FACEBOOK_CLIENT_ID,
      clientSecret: env.FACEBOOK_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role as Role
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const email = profile?.email
        if (!email) return false

        // Check if user exists
        const existingUser = await db.user.findUnique({
          where: { email }
        })

        if (!existingUser) {
          // Create new user
          await db.user.create({
            data: {
              email,
              name: profile.name,
              image: profile.picture,
              role: Role.USER,
              password: "", // OAuth users don't need a password
            }
          })
        }
      }

      if (account?.provider === "github") {
        const email = profile?.email
        if (!email) return false

        // Check if user exists
        const existingUser = await db.user.findUnique({
          where: { email }
        })

        if (!existingUser) {
          // Create new user
          await db.user.create({
            data: {
              email,
              name: profile.name,
              image: profile.avatar_url,
              role: Role.USER,
              password: "", // OAuth users don't need a password
            }
          })
        }
      }

      return true
    },
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.email = token.email as string
        session.user.image = token.picture as string
        session.user.role = token.role as Role
      }

      return session
    },
    async jwt({ token, user }) {
      const dbUser = await db.user.findFirst({
        where: {
          email: token.email ?? undefined,
        },
      })

      if (!dbUser) {
        if (user?.id) {
          token.id = user.id
          token.role = user.role
        }
        return token
      }

      return {
        id: dbUser.id,
        name: dbUser.name ?? undefined,
        email: dbUser.email,
        picture: dbUser.image ?? undefined,
        role: dbUser.role as Role,
      }
    }
  }
}

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth(authOptions)
