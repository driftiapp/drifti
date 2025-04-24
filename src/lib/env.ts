import { z } from "zod"

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]),
    DATABASE_URL: z.string().url(),
    NEXTAUTH_URL: z.string().url(),
    NEXTAUTH_SECRET: z.string().min(1),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),
    TWITTER_CLIENT_ID: z.string().min(1),
    TWITTER_CLIENT_SECRET: z.string().min(1),
    FACEBOOK_CLIENT_ID: z.string().min(1),
    FACEBOOK_CLIENT_SECRET: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
    // SMTP settings
    SMTP_HOST: z.string().min(1),
    SMTP_PORT: z.string().transform(Number),
    SMTP_SECURE: z.string().transform((val) => val === "true"),
    SMTP_USER: z.string().min(1),
    SMTP_PASSWORD: z.string().min(1),
    SMTP_FROM: z.string().email(),
    NEXT_PUBLIC_APP_URL: z.string().url(),
})

const _env = envSchema.safeParse(process.env)

if (!_env.success) {
    console.error("❌ Invalid environment variables:", _env.error.format())
    throw new Error("Invalid environment variables")
}

export const env = _env.data 