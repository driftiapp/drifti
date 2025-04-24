'use server'

import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

const themeSchema = z.enum(['LIGHT', 'DARK', 'SEPIA', 'HIGH_CONTRAST', 'RIDER', 'DRIVER', 'OWNER'])

export async function updateUserTheme(theme: string) {
  try {
    // Validate theme
    const validatedTheme = themeSchema.parse(theme.toUpperCase())

    // Get user session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    // Update user theme preference
    await prisma.user.update({
      where: { id: session.user.id },
      data: { theme: validatedTheme }
    })

    // Revalidate user profile page
    revalidatePath('/profile')

    return { success: true }
  } catch (error) {
    console.error('Error updating theme:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function getUserTheme() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return 'LIGHT' // Default theme
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { theme: true }
    })

    return user?.theme || 'LIGHT'
  } catch (error) {
    console.error('Error getting theme:', error)
    return 'LIGHT'
  }
} 