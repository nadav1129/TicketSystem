import { MoreHorizontal } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "../../ui/badge";
import { Checkbox } from "../../ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { Select } from "../../ui/select";
import type { AnalyticsTicket } from "./analytics.types";

type BuildColumnsArgs = {
  reviewers: string[];
  onReviewerChange: (ticketId: number, reviewer: string) => void;
  onOpenTicket: (ticketId: number) => void;
};

function statusVariant(
  status: string,
): "success" | "info" | "danger" | "warning" | "secondary" {
  if (status === "Resolved" || status === "Closed") return "success";
  if (status === "In Progress") return "info";
  if (status === "Escalated") return "danger";
  if (status === "Open" || status === "New") return "warning";
  return "secondary";
}

export function buildAnalyticsColumns({
  reviewers,
  onReviewerChange,
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
      accessorKey: "product",
      header: "Header",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-zinc-100">{row.original.product}</span>
          <span className="text-xs text-zinc-500">{row.original.ticketNumber}</span>
        </div>
      ),
    },
    {
      accessorKey: "sectionType",
      header: "Section Type",
      cell: ({ row }) => <Badge variant="outline">{row.original.sectionType}</Badge>,
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
      accessorKey: "target",
      header: "Target",
      cell: ({ row }) => <span className="font-medium text-zinc-100">{row.original.target}</span>,
    },
    {
      accessorKey: "limit",
      header: "Limit",
      cell: ({ row }) => <span className="font-medium text-zinc-100">{row.original.limit}</span>,
    },
    {
      accessorKey: "reviewer",
      header: "Reviewer",
      cell: ({ row }) => (
        <Select
          value={row.original.reviewer}
          onChange={(event) => onReviewerChange(row.original.rawId, event.target.value)}
          className="h-8 w-44 text-xs"
        >
          {reviewers.map((reviewer) => (
            <option key={reviewer} value={reviewer}>
              {reviewer}
            </option>
          ))}
        </Select>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      header: "",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-md p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100">
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onOpenTicket(row.original.rawId)}>
              Open ticket
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onReviewerChange(row.original.rawId, "Unassigned")}>
              Clear reviewer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
