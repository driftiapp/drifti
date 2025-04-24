import { format, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";
import { ActivityAction, EntityType } from "./activity-logger";
import {
    User,
    Download,
    Mail,
    LogIn,
    LogOut,
    Settings,
    Trash2,
    CheckCircle,
    XCircle,
    AlertCircle
} from "lucide-react";

export interface Activity {
    id: string;
    userId: string;
    action: ActivityAction;
    entityType: EntityType;
    entityId?: string;
    details?: Record<string, any>;
    ipAddress: string;
    userAgent: string;
    createdAt: Date;
    user: {
        name: string | null;
        email: string;
        role: string;
    };
}

export interface GroupedActivities {
    [key: string]: Activity[];
}

export function groupActivitiesByTime(activities: Activity[]): GroupedActivities {
    return activities.reduce((groups, activity) => {
        const date = new Date(activity.createdAt);
        let groupKey: string;

        if (isToday(date)) {
            groupKey = "Today";
        } else if (isYesterday(date)) {
            groupKey = "Yesterday";
        } else if (isThisWeek(date)) {
            groupKey = "This Week";
        } else if (isThisMonth(date)) {
            groupKey = "This Month";
        } else {
            groupKey = format(date, "MMMM yyyy");
        }

        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(activity);
        return groups;
    }, {} as GroupedActivities);
}

export function getActivityIcon(action: ActivityAction) {
    switch (action) {
        case "USER_LOGIN":
            return LogIn;
        case "USER_LOGOUT":
            return LogOut;
        case "USER_UPDATE":
            return Settings;
        case "USER_ROLE_CHANGE":
            return User;
        case "USER_DELETE":
            return Trash2;
        case "DOWNLOAD_START":
            return Download;
        case "DOWNLOAD_COMPLETE":
            return CheckCircle;
        case "DOWNLOAD_FAIL":
            return XCircle;
        case "INVITATION_CREATE":
            return Mail;
        case "INVITATION_ACCEPT":
            return CheckCircle;
        case "INVITATION_REJECT":
            return AlertCircle;
        default:
            return AlertCircle;
    }
}

export function formatActivityDetails(activity: Activity): string {
    const { action, entityType, details } = activity;

    switch (action) {
        case "USER_LOGIN":
            return `Logged in from ${activity.ipAddress}`;
        case "USER_LOGOUT":
            return `Logged out from ${activity.ipAddress}`;
        case "USER_UPDATE":
            return `Updated profile information`;
        case "USER_ROLE_CHANGE":
            return `Role changed to ${details?.newRole || "unknown"}`;
        case "USER_DELETE":
            return `User account deleted`;
        case "DOWNLOAD_START":
            return `Started downloading ${details?.filename || "file"}`;
        case "DOWNLOAD_COMPLETE":
            return `Completed downloading ${details?.filename || "file"}`;
        case "DOWNLOAD_FAIL":
            return `Failed to download ${details?.filename || "file"}: ${details?.error || "Unknown error"}`;
        case "INVITATION_CREATE":
            return `Created invitation for ${details?.email || "user"}`;
        case "INVITATION_ACCEPT":
            return `Accepted invitation from ${details?.inviter || "user"}`;
        case "INVITATION_REJECT":
            return `Rejected invitation from ${details?.inviter || "user"}`;
        default:
            return "No additional details";
    }
} 