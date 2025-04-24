import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Activity, formatActivityDetails, getActivityIcon } from "@/lib/activity-utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ActivityDetailModalProps {
    activity: Activity | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ActivityDetailModal({
    activity,
    open,
    onOpenChange,
}: ActivityDetailModalProps) {
    if (!activity) return null;

    const Icon = getActivityIcon(activity.action);
    const details = formatActivityDetails(activity);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        <span>{activity.action.replace("_", " ")}</span>
                    </DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh]">
                    <div className="space-y-4 p-4">
                        <div className="space-y-2">
                            <h3 className="font-semibold">User</h3>
                            <div className="flex items-center gap-2">
                                <span>{activity.user.name || activity.user.email}</span>
                                <Badge variant="secondary">{activity.user.role}</Badge>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-semibold">Details</h3>
                            <p className="text-sm text-muted-foreground">{details}</p>
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-semibold">Technical Information</h3>
                            <div className="grid gap-2 text-sm">
                                <div>
                                    <span className="font-medium">IP Address:</span>{" "}
                                    <span className="text-muted-foreground">{activity.ipAddress}</span>
                                </div>
                                <div>
                                    <span className="font-medium">User Agent:</span>{" "}
                                    <span className="text-muted-foreground">{activity.userAgent}</span>
                                </div>
                                <div>
                                    <span className="font-medium">Timestamp:</span>{" "}
                                    <span className="text-muted-foreground">
                                        {format(new Date(activity.createdAt), "PPpp")}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {activity.details && (
                            <div className="space-y-2">
                                <h3 className="font-semibold">Raw Details</h3>
                                <pre className="rounded-lg bg-muted p-4 text-sm">
                                    {JSON.stringify(activity.details, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
} 