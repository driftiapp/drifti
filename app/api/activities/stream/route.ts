import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ActivityAction, EntityType } from "@/lib/activity-logger";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as EntityType | "ALL" | null;
    const action = searchParams.get("action") as ActivityAction | null;

    // Create a TransformStream for the response
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Function to send data to the client
    const sendData = async (data: any) => {
      await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    };

    // Initial data fetch
    const where: any = {};
    if (type && type !== "ALL") {
      where.entityType = type;
    }
    if (action) {
      where.action = action;
    }

    const initialActivities = await prisma.activityLog.findMany({
      where,
      take: 20,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Send initial data
    await sendData({ type: "initial", activities: initialActivities });

    // Set up a polling interval to check for new activities
    const interval = setInterval(async () => {
      const latestActivity = await prisma.activityLog.findFirst({
        where,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      if (latestActivity) {
        await sendData({ type: "update", activity: latestActivity });
      }
    }, 5000); // Check every 5 seconds

    // Cleanup function
    const cleanup = () => {
      clearInterval(interval);
      writer.close();
    };

    // Handle client disconnect
    request.signal.addEventListener("abort", cleanup);

    return new NextResponse(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in activity stream:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 