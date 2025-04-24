import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { subDays, subMonths, subWeeks, subYears } from "date-fns";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
      return new NextResponse("Missing date range", { status: 400 });
    }

    const currentFrom = new Date(from);
    const currentTo = new Date(to);
    const rangeInDays = Math.ceil(
      (currentTo.getTime() - currentFrom.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate previous period dates
    let previousFrom: Date;
    let previousTo: Date;

    if (rangeInDays <= 7) {
      // For weekly view, compare with previous week
      previousFrom = subWeeks(currentFrom, 1);
      previousTo = subWeeks(currentTo, 1);
    } else if (rangeInDays <= 31) {
      // For monthly view, compare with previous month
      previousFrom = subMonths(currentFrom, 1);
      previousTo = subMonths(currentTo, 1);
    } else {
      // For yearly view, compare with previous year
      previousFrom = subYears(currentFrom, 1);
      previousTo = subYears(currentTo, 1);
    }

    // Fetch current period data
    const [currentUsers, currentInvitations] = await Promise.all([
      fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/users?from=${currentFrom.toISOString()}&to=${currentTo.toISOString()}`
      ).then((res) => res.json()),
      fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/invitations?from=${currentFrom.toISOString()}&to=${currentTo.toISOString()}`
      ).then((res) => res.json()),
    ]);

    // Fetch previous period data
    const [previousUsers, previousInvitations] = await Promise.all([
      fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/users?from=${previousFrom.toISOString()}&to=${previousTo.toISOString()}`
      ).then((res) => res.json()),
      fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/invitations?from=${previousFrom.toISOString()}&to=${previousTo.toISOString()}`
      ).then((res) => res.json()),
    ]);

    // Calculate metrics
    const currentMetrics = {
      newUsers: currentUsers.length,
      activeUsers: currentUsers.filter((user: any) => user.lastLogin).length,
      totalInvitations: currentInvitations.length,
      acceptedInvitations: currentInvitations.filter(
        (inv: any) => inv.acceptedAt
      ).length,
    };

    const previousMetrics = {
      newUsers: previousUsers.length,
      activeUsers: previousUsers.filter((user: any) => user.lastLogin).length,
      totalInvitations: previousInvitations.length,
      acceptedInvitations: previousInvitations.filter(
        (inv: any) => inv.acceptedAt
      ).length,
    };

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const changes = {
      newUsers: calculateChange(
        currentMetrics.newUsers,
        previousMetrics.newUsers
      ),
      activeUsers: calculateChange(
        currentMetrics.activeUsers,
        previousMetrics.activeUsers
      ),
      totalInvitations: calculateChange(
        currentMetrics.totalInvitations,
        previousMetrics.totalInvitations
      ),
      acceptedInvitations: calculateChange(
        currentMetrics.acceptedInvitations,
        previousMetrics.acceptedInvitations
      ),
    };

    return NextResponse.json({
      current: currentMetrics,
      previous: previousMetrics,
      changes,
    });
  } catch (error) {
    console.error("[METRICS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 