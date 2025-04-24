import { PrismaClient, Role, ThemeType } from '@prisma/client'
import { hash } from 'bcrypt'

const prismaClient = new PrismaClient()

async function main() {
  // Create sample users with different themes
  const users = [
    {
      name: 'John Doe',
      email: 'john@example.com',
      password: await hash('password123', 10),
      role: Role.USER,
      theme: ThemeType.LIGHT,
    },
    {
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: await hash('password123', 10),
      role: Role.USER,
      theme: ThemeType.DARK,
    },
    {
      name: 'Alex Johnson',
      email: 'alex@example.com',
      password: await hash('password123', 10),
      role: Role.USER,
      theme: ThemeType.SEPIA,
    },
    {
      name: 'Sarah Wilson',
      email: 'sarah@example.com',
      password: await hash('password123', 10),
      role: Role.USER,
      theme: ThemeType.HIGH_CONTRAST,
    },
  ]

  // Create users in the database
  for (const user of users) {
    await prismaClient.user.upsert({
      where: { email: user.email },
      update: user,
      create: user,
    })
  }

  console.log('Seed data created successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prismaClient.$disconnect()
  }) 