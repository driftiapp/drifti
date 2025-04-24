import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ActivityType } from "@/lib/activity-logger";
import { format } from "date-fns";
import { Prisma } from "@prisma/client";

const exportSchema = z.object({
  type: z.enum(["LOGIN", "LOGOUT", "CREATE", "UPDATE", "DELETE", "EXPORT", "IMPORT"]).optional(),
  userId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
});

type ActivityWithUser = {
  id: string;
  userId: string;
  type: ActivityType;
  description: string;
  ipAddress: string;
  userAgent: string;
  metadata: any;
  createdAt: Date;
  user: {
    name: string | null;
    email: string;
    role: string;
  };
};

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
    };

    const validatedParams = exportSchema.parse(params);
    const { type, userId, startDate, endDate, search } = validatedParams;

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

    // Fetch activities
    const activities = await prisma.$queryRaw<ActivityWithUser[]>`
      SELECT al.*, u.name, u.email, u.role
      FROM "ActivityLog" al
      JOIN "User" u ON al."userId" = u.id
      ${where.OR ? Prisma.sql`WHERE ${Prisma.join(where.OR, ' OR ')}` : Prisma.empty}
      ORDER BY al."createdAt" DESC
    `;

    // Format activities for CSV
    const csvRows = [
      // Header row
      [
        "ID",
        "User",
        "Email",
        "Role",
        "Type",
        "Description",
        "IP Address",
        "User Agent",
        "Metadata",
        "Created At",
      ].join(","),
    ];

    // Data rows
    activities.forEach((activity) => {
      const row = [
        activity.id,
        activity.user.name || "",
        activity.user.email,
        activity.user.role,
        activity.type,
        activity.description,
        activity.ipAddress,
        activity.userAgent,
        activity.metadata ? JSON.stringify(activity.metadata) : "",
        format(new Date(activity.createdAt), "yyyy-MM-dd HH:mm:ss"),
      ].map((field) => `"${field.toString().replace(/"/g, '""')}"`).join(",");
      csvRows.push(row);
    });

    const csv = csvRows.join("\n");
    const filename = `activity-log-${format(new Date(), "yyyy-MM-dd")}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting activities:", error);
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 