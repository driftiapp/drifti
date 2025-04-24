import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays, startOfDay, endOfDay, eachDayOfInterval, format } from "date-fns";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const compare = searchParams.get("compare") === "true";

    const dateRange = {
      from: from ? new Date(from) : subDays(new Date(), 30),
      to: to ? new Date(to) : new Date(),
    };

    // Get daily activity
    const dailyActivity = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "createdAt") as date,
        COUNT(DISTINCT "userId") as "activeUsers",
        COUNT(*) as sessions
      FROM "Session"
      WHERE "createdAt" BETWEEN ${dateRange.from} AND ${dateRange.to}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date ASC
    `;

    // Get hourly activity
    const hourlyActivity = await prisma.$queryRaw`
      SELECT 
        EXTRACT(HOUR FROM "createdAt") as hour,
        COUNT(DISTINCT "userId") as "activeUsers"
      FROM "Session"
      WHERE "createdAt" BETWEEN ${dateRange.from} AND ${dateRange.to}
      GROUP BY EXTRACT(HOUR FROM "createdAt")
      ORDER BY hour ASC
    `;

    // Get top active users
    const topUsers = await prisma.$queryRaw`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        MAX(s."createdAt") as "lastActive",
        COUNT(s.id) as sessions
      FROM "User" u
      LEFT JOIN "Session" s ON s."userId" = u.id
      WHERE s."createdAt" BETWEEN ${dateRange.from} AND ${dateRange.to}
      GROUP BY u.id, u.name, u.email, u.role
      ORDER BY sessions DESC
      LIMIT 10
    `;

    // Get summary metrics
    const summary = await prisma.$queryRaw`
      SELECT 
        COUNT(DISTINCT "userId") as "totalActiveUsers",
        COUNT(*) as "totalSessions",
        AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt"))) as "averageSessionDuration",
        MODE() WITHIN GROUP (ORDER BY EXTRACT(HOUR FROM "createdAt")) as "peakHour"
      FROM "Session"
      WHERE "createdAt" BETWEEN ${dateRange.from} AND ${dateRange.to}
    `;

    // If comparison is enabled, get previous period data
    let previousData = null;
    if (compare) {
      const previousRange = {
        from: subDays(dateRange.from, dateRange.to.getTime() - dateRange.from.getTime()),
        to: dateRange.from,
      };

      const previousSummary = await prisma.$queryRaw`
        SELECT 
          COUNT(DISTINCT "userId") as "totalActiveUsers",
          COUNT(*) as "totalSessions"
        FROM "Session"
        WHERE "createdAt" BETWEEN ${previousRange.from} AND ${previousRange.to}
      `;

      previousData = {
        summary: previousSummary[0],
      };
    }

    return NextResponse.json({
      dailyActivity,
      hourlyActivity,
      topUsers,
      summary: summary[0],
      previousData,
    });
  } catch (error) {
    console.error("[ACTIVITY_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 