import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Checkbox } from "../../ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import type { AnalyticsTicket } from "./analytics.types";

type BuildColumnsArgs = {
  onOpenTicket: (ticketId: number) => void;
};

function statusVariant(
  status: string,
): "success" | "info" | "danger" | "warning" | "secondary" {
  if (status === "Resolved" || status === "Closed") return "success";
  if (status === "In Progress" || status === "Waiting Customer") return "info";
  if (status === "Urgent") return "danger";
  if (status === "Open" || status === "New") return "warning";
  return "secondary";
}

function priorityVariant(
  priority: string,
): "success" | "info" | "danger" | "warning" | "secondary" {
  if (priority === "Urgent") return "danger";
  if (priority === "High") return "warning";
  if (priority === "Medium") return "info";
  if (priority === "Low") return "secondary";
  return "secondary";
}

export function buildAnalyticsColumns({
  onOpenTicket,
}: BuildColumnsArgs): ColumnDef<AnalyticsTicket>[] {
  return [
    {
      id: "select",
      size: 30,
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onChange={(event) => table.toggleAllPageRowsSelected(event.currentTarget.checked)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onChange={(event) => row.toggleSelected(event.currentTarget.checked)}
          aria-label={`Select ${row.original.ticketNumber}`}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "subject",
      header: "Ticket",
      cell: ({ row }) => (
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-zinc-100">{row.original.subject}</span>
          <span className="truncate text-xs text-zinc-500">
            {row.original.ticketNumber} · {row.original.product}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "requester",
      header: "Requester",
      cell: ({ row }) => (
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-zinc-100">{row.original.requester}</span>
          <span className="truncate text-xs text-zinc-500">{row.original.assignedAgent}</span>
        </div>
      ),
    },
    {
      accessorKey: "channel",
      header: "Channel",
      cell: ({ row }) => <Badge variant="outline">{row.original.channel}</Badge>,
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => (
        <Badge variant={priorityVariant(row.original.priority)}>
          {row.original.priority}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={statusVariant(row.original.status)}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "date",
      header: "Created",
      cell: ({ row }) => <span className="font-medium text-zinc-100">{row.original.date}</span>,
    },
    {
      id: "actions",
      enableHiding: false,
      header: "",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100"
              aria-label={`Open actions for ${row.original.ticketNumber}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onOpenTicket(row.original.rawId)}>
              Open ticket
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
