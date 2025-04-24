"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { Route } from "next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface Invitation {
  id: string;
  email: string;
  role: "ADMIN" | "USER";
  status: "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";
  expiresAt: Date;
  createdAt: Date;
  invitedBy: {
    name: string | null;
    email: string;
  };
  acceptedBy?: {
    id: string;
    name: string | null;
    email: string;
  };
}

export default function InvitationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter() as AppRouterInstance;
  const { toast } = useToast();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "USER">("USER");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated" && (session?.user?.role as string) !== "ADMIN") {
      router.push("/");
    }
  }, [status, session, router]);

  const fetchInvitations = async () => {
    try {
      const response = await fetch("/api/users/invitations");
      if (!response.ok) throw new Error("Failed to fetch invitations");
      const data = await response.json();
      setInvitations(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch invitations",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleSendInvitation = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send invitation");
      }

      toast({
        title: "Success",
        description: "Invitation sent successfully",
      });

      setEmail("");
      setRole("USER");
      fetchInvitations();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeInvitation = async (id: string) => {
    try {
      const response = await fetch(`/api/users/invitations/${id}/revoke`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to revoke invitation");
      }

      toast({
        title: "Success",
        description: "Invitation revoked successfully",
      });

      fetchInvitations();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to revoke invitation",
        variant: "destructive",
      });
    }
  };

  const handleResendInvitation = async (id: string) => {
    try {
      const response = await fetch(`/api/users/invitations/${id}/resend`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to resend invitation");
      }

      toast({
        title: "Success",
        description: "Invitation resent successfully",
      });

      fetchInvitations();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to resend invitation",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "ACCEPTED":
        return <Badge variant="outline" className="bg-green-100 text-green-800">Accepted</Badge>;
      case "REVOKED":
        return <Badge variant="outline" className="bg-red-100 text-red-800">Revoked</Badge>;
      case "EXPIRED":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">Manage Invitations</h1>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Send New Invitation</h2>
        <div className="flex gap-4">
          <Input
            type="email"
            placeholder="Enter email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="max-w-md"
          />
          <Select
            value={role}
            onValueChange={(value: "ADMIN" | "USER") => setRole(value)}
          >
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </Select>
          <Button onClick={handleSendInvitation} disabled={isLoading}>
            {isLoading ? "Sending..." : "Send Invitation"}
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Sent Invitations</h2>
        <Table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Expires At</th>
              <th>Created At</th>
              <th>Invited By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invitations.map((invitation) => (
              <tr key={invitation.id}>
                <td>{invitation.email}</td>
                <td>{invitation.role}</td>
                <td>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(invitation.status)}
                    {invitation.status === "ACCEPTED" && invitation.acceptedBy && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0"
                              asChild
                            >
                              <Link
                                href={`/admin/users/${invitation.acceptedBy.id}` as Route}
                                prefetch={false}
                              >
                                View Profile
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View user profile</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </td>
                <td>{format(new Date(invitation.expiresAt), "PPp")}</td>
                <td>{format(new Date(invitation.createdAt), "PPp")}</td>
                <td>{invitation.invitedBy.name || invitation.invitedBy.email}</td>
                <td>
                  {invitation.status === "PENDING" && (
                    <div className="flex gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Resend
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Resend Invitation</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to resend this invitation? A new email will be sent to {invitation.email}.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleResendInvitation(invitation.id)}>
                                    Resend
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Send a new email with an updated link</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  Revoke
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Revoke Invitation</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to revoke this invitation? This action cannot be undone and the user will not be able to register with this invitation.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleRevokeInvitation(invitation.id)}>
                                    Revoke
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Cancel this invite — user won&apos;t be able to register</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
} 