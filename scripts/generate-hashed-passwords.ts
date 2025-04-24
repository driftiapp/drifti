import { hashPassword } from "../src/auth"

async function main() {
  const passwords = {
    admin: "admin123",
    driver: "driver123",
    business: "business123"
  }

  console.log("Generating hashed passwords...")
  console.log("-----------------------------")

  for (const [user, password] of Object.entries(passwords)) {
    const hashedPassword = await hashPassword(password)
    console.log(`${user}: ${hashedPassword}`)
  }

  console.log("-----------------------------")
  console.log("Copy these hashed passwords into your auth.ts file")
}

main().catch(console.error) 