import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ActivityType } from "@/lib/activity-logger";
import { Prisma } from "@prisma/client";

const activitySchema = z.object({
  type: z.enum(["LOGIN", "LOGOUT", "CREATE", "UPDATE", "DELETE", "EXPORT", "IMPORT"]).optional(),
  userId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = {
      type: searchParams.get("type"),
      userId: searchParams.get("userId"),
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
      search: searchParams.get("search"),
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    };

    const validatedParams = activitySchema.parse(params);
    const { type, userId, startDate, endDate, search, page, limit } = validatedParams;

    const skip = (page - 1) * limit;

    // Build the where clause
    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { type: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "ActivityLog" al
      ${where.OR ? Prisma.sql`WHERE ${Prisma.join(where.OR, ' OR ')}` : Prisma.empty}
    `;

    // Fetch activities with pagination
    const activities = await prisma.$queryRaw`
      SELECT al.*, u.name, u.email, u.role
      FROM "ActivityLog" al
      JOIN "User" u ON al."userId" = u.id
      ${where.OR ? Prisma.sql`WHERE ${Prisma.join(where.OR, ' OR ')}` : Prisma.empty}
      ORDER BY al."createdAt" DESC
      LIMIT ${limit}
      OFFSET ${skip}
    `;

    return NextResponse.json({
      activities,
      pagination: {
        total: Number(total[0].count),
        page,
        limit,
        totalPages: Math.ceil(Number(total[0].count) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching activities:", error);
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 