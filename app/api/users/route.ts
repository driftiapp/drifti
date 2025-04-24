import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  sortBy: z.enum(["name", "email", "role", "createdAt", "lastLogin"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
})

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = querySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      search: searchParams.get("search"),
      role: searchParams.get("role"),
      sortBy: searchParams.get("sortBy"),
      sortOrder: searchParams.get("sortOrder"),
    })

    const where = {
      AND: [
        query.search
          ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" } },
              { email: { contains: query.search, mode: "insensitive" } },
            ],
          }
          : {},
        query.role ? { role: query.role } : {},
      ],
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: {
          [query.sortBy]: query.sortOrder,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          lastLogin: true,
        },
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      users,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 