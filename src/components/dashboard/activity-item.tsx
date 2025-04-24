import React from "react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Activity, formatActivityDetails, getActivityIcon } from "@/lib/activity-utils";
import { motion } from "framer-motion";

interface ActivityItemProps {
    activity: Activity;
    measureRef?: (node: HTMLDivElement) => void;
    onClick?: () => void;
}

export const ActivityItem = React.memo(({ activity, measureRef, onClick }: ActivityItemProps) => {
    const Icon = getActivityIcon(activity.action);
    const details = formatActivityDetails(activity);

    const getActionColor = (action: string) => {
        switch (action) {
            case "USER_LOGIN":
            case "DOWNLOAD_COMPLETE":
            case "INVITATION_ACCEPT":
                return "bg-green-100 text-green-800";
            case "USER_LOGOUT":
            case "DOWNLOAD_START":
            case "INVITATION_CREATE":
                return "bg-blue-100 text-blue-800";
            case "USER_UPDATE":
            case "USER_ROLE_CHANGE":
                return "bg-yellow-100 text-yellow-800";
            case "USER_DELETE":
            case "DOWNLOAD_FAIL":
            case "INVITATION_REJECT":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const isImportantEvent = (action: string) => {
        return [
            "USER_DELETE",
            "USER_ROLE_CHANGE",
            "DOWNLOAD_FAIL",
            "INVITATION_REJECT",
        ].includes(action);
    };

    const getActivityHighlight = (activity: Activity) => {
        if (isImportantEvent(activity.action)) {
            return "border-red-200 bg-red-50/50";
        }
        return "";
    };

    return (
        <motion.div
            ref={measureRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className={cn(
                "flex flex-col sm:flex-row items-start gap-4 rounded-lg border p-4 hover:bg-accent/50 transition-colors cursor-pointer",
                getActivityHighlight(activity)
            )}
            onClick={onClick}
            role="button"
            tabIndex={0}
            aria-label={`View details for ${activity.action.replace("_", " ")} activity`}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onClick?.();
                }
            }}
        >
            <div className="flex-1 space-y-1 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        <Badge
                            className={getActionColor(activity.action)}
                            variant="secondary"
                        >
                            {activity.action.replace("_", " ")}
                        </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                        by {activity.user.name || activity.user.email}
                    </span>
                </div>
                <p className="text-sm break-words">{details}</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs text-muted-foreground">
                    <span>
                        {format(new Date(activity.createdAt), "MMM d, yyyy h:mm a")}
                    </span>
                    <span className="hidden sm:inline" aria-hidden="true">•</span>
                    <span className="break-all">{activity.ipAddress}</span>
                </div>
            </div>
        </motion.div>
    );
});

ActivityItem.displayName = "ActivityItem"; 