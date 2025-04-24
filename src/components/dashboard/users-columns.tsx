import { ColumnDef } from "@tanstack/react-table";
import { User } from "@prisma/client";
import { format } from "date-fns";

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ row }) => {
      return format(new Date(row.getValue("createdAt")), "MMM d, yyyy");
    },
  },
  {
    accessorKey: "lastLogin",
    header: "Last Login",
    cell: ({ row }) => {
      const date = row.getValue("lastLogin");
      return date ? format(new Date(date), "MMM d, yyyy") : "Never";
    },
  },
]; 