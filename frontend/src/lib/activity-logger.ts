import { headers } from "next/headers";
import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";

export type ActivityType = "LOGIN" | "LOGOUT" | "CREATE" | "UPDATE" | "DELETE" | "EXPORT" | "IMPORT";

export interface ActivityLogEntry {
    id: string;
    userId: string;
    type: ActivityType;
    description: string;
    ipAddress: string;
    userAgent: string;
    metadata?: Record<string, any>;
    createdAt: Date;
}

/**
 * Logs a user activity
 * @param userId - The ID of the user performing the activity
 * @param type - The type of activity
 * @param description - A description of the activity
 * @param metadata - Optional metadata about the activity
 */
export async function logActivity(
    userId: string,
    type: ActivityType,
    description: string,
    metadata?: Record<string, unknown>
) {
    try {
        const headersList = headers();
        const ipAddress = (headersList instanceof Map ? headersList.get("x-forwarded-for") : null) || "unknown";
        const userAgent = (headersList instanceof Map ? headersList.get("user-agent") : null) || "unknown";

        await prisma.$queryRaw`
      INSERT INTO "ActivityLog" ("id", "userId", "type", "description", "ipAddress", "userAgent", "metadata", "createdAt")
      VALUES (
        gen_random_uuid(),
        ${userId},
        ${type},
        ${description},
        ${ipAddress},
        ${userAgent},
        ${metadata ? JSON.stringify(metadata) : null}::jsonb,
        NOW()
      )
    `;
    } catch (error) {
        console.error("[Activity Logger Error]", error);
    }
}

/**
 * Gets recent activity for a user
 * @param userId - The ID of the user
 * @param limit - Optional limit of activities to return
 */
export async function getRecentActivity(userId: string, limit?: number) {
    try {
        const activities = await prisma.$queryRaw<Array<{
            id: string;
            userId: string;
            type: ActivityType;
            description: string;
            ipAddress: string;
            userAgent: string;
            metadata: Prisma.JsonValue | null;
            createdAt: Date;
        }>>`
      SELECT *
      FROM "ActivityLog"
      WHERE "userId" = ${userId}
      ORDER BY "createdAt" DESC
      ${limit ? Prisma.sql`LIMIT ${limit}` : Prisma.empty}
    `;
        return activities;
    } catch (error) {
        console.error("[Activity Logger Error]", error);
        return [];
    }
}

/**
 * Gets activities by type
 * @param type - The type of activity to filter by
 * @param limit - Optional limit of activities to return
 */
export async function getActivityByType(type: ActivityType, limit?: number) {
    try {
        const activities = await prisma.$queryRaw<Array<{
            id: string;
            userId: string;
            type: ActivityType;
            description: string;
            ipAddress: string;
            userAgent: string;
            metadata: Prisma.JsonValue | null;
            createdAt: Date;
        }>>`
      SELECT *
      FROM "ActivityLog"
      WHERE "type" = ${type}
      ORDER BY "createdAt" DESC
      ${limit ? Prisma.sql`LIMIT ${limit}` : Prisma.empty}
    `;
        return activities;
    } catch (error) {
        console.error("[Activity Logger Error]", error);
        return [];
    }
}

/**
 * Gets activities within a date range
 * @param startDate - The start date of the range
 * @param endDate - The end date of the range
 */
export async function getActivityByDateRange(startDate: Date, endDate: Date) {
    try {
        const activities = await prisma.$queryRaw<Array<{
            id: string;
            userId: string;
            type: ActivityType;
            description: string;
            ipAddress: string;
            userAgent: string;
            metadata: Prisma.JsonValue | null;
            createdAt: Date;
        }>>`
      SELECT *
      FROM "ActivityLog"
      WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
      ORDER BY "createdAt" DESC
    `;
        return activities;
    } catch (error) {
        console.error("[Activity Logger Error]", error);
        return [];
    }
} 