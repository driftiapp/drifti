import nodemailer from "nodemailer"

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  secure: true,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
})

interface SendVerificationEmailParams {
  email: string
  token: string
  name: string
}

export async function sendVerificationEmail({
  email,
  token,
  name,
}: SendVerificationEmailParams) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify?token=${token}`

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Verify your email address",
    html: `
      <div>
        <h1>Welcome to Driftix!</h1>
        <p>Hi ${name},</p>
        <p>Thanks for signing up. Please verify your email address by clicking the link below:</p>
        <p>
          <a href="${verificationUrl}">Verify Email Address</a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p>${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
        <p>Thanks,<br>The Driftix Team</p>
      </div>
    `,
  })
}

interface SendPasswordResetEmailParams {
  email: string
  token: string
  name: string
}

export async function sendPasswordResetEmail({
  email,
  token,
  name,
}: SendPasswordResetEmailParams) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Reset your password",
    html: `
      <div>
        <h1>Reset Your Password</h1>
        <p>Hi ${name},</p>
        <p>We received a request to reset your password. Click the link below to set a new password:</p>
        <p>
          <a href="${resetUrl}">Reset Password</a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p>${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
        <p>Thanks,<br>The Driftix Team</p>
      </div>
    `,
  })
}

interface InvitationEmailProps {
  to: string;
  token: string;
}

export async function sendInvitationEmail({ to, token }: InvitationEmailProps) {
  const invitationLink = `${process.env.NEXTAUTH_URL}/auth/register?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2563eb;">Welcome to Driftix!</h1>
      <p>You've been invited to join our platform. Click the button below to create your account:</p>
      <a href="${invitationLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">
        Create Account
      </a>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all;">${invitationLink}</p>
      <p>This invitation link will expire in 7 days.</p>
      <p>If you didn't request this invitation, you can safely ignore this email.</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: "You've been invited to join Driftix",
    html,
  });
} 