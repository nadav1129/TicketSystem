import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Columns3 } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { Input } from "../../ui/input";
import { Select } from "../../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Tabs, TabsList, TabsTrigger } from "../../ui/tabs";
import { buildAnalyticsColumns } from "./analytics.columns";
import type { AnalyticsFilterTab, AnalyticsTicket } from "./analytics.types";

type AnalyticsDataTableProps = {
  data: AnalyticsTicket[];
  isLoading: boolean;
  error: string;
  tab: AnalyticsFilterTab;
  onTabChange: (tab: AnalyticsFilterTab) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onOpenTicket: (ticketId: number) => void;
  onCreateTicket: () => void;
};

export default function AnalyticsDataTable({
  data,
  isLoading,
  error,
  tab,
  onTabChange,
  search,
  onSearchChange,
  onOpenTicket,
  onCreateTicket,
}: AnalyticsDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const columns = useMemo(
    () =>
      buildAnalyticsColumns({
        onOpenTicket,
      }),
    [onOpenTicket],
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      rowSelection,
      columnVisibility,
      pagination,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
  });

  return (
    <div className="space-y-3 rounded-md border border-zinc-800 bg-black p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={(value) => onTabChange(value as AnalyticsFilterTab)}>
          <TabsList className="h-8">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search ticket, subject, requester, product..."
            className="h-8 w-72 text-xs"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Columns3 className="h-3.5 w-3.5" />
                Customize Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllLeafColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(checked) => column.toggleVisibility(checked)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
              <DropdownMenuSeparator />
              <div className="px-2 py-1 text-xs text-zinc-500">Columns are saved for this session.</div>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            size="sm"
            className="h-8 border-emerald-600 bg-emerald-600 text-zinc-950 hover:bg-emerald-500"
            onClick={onCreateTicket}
          >
            New Ticket
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-zinc-800">
        <Table>
          <TableHeader className="bg-zinc-900/90">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-zinc-900/90">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {error && (
              <TableRow>
                <TableCell className="text-rose-300" colSpan={columns.length}>
                  {error}
                </TableCell>
              </TableRow>
            )}

            {!error && isLoading && (
              <TableRow>
                <TableCell className="text-zinc-400" colSpan={columns.length}>
                  Loading tickets...
                </TableCell>
              </TableRow>
            )}

            {!error &&
              !isLoading &&
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="h-10"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!error && !isLoading && table.getRowModel().rows.length === 0 && (
              <TableRow>
                <TableCell className="text-zinc-500" colSpan={columns.length}>
                  No rows found for the current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Badge variant="secondary">{table.getFilteredSelectedRowModel().rows.length} selected</Badge>
          <span>{data.length} total rows</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Rows per page</span>
          <Select
            value={String(table.getState().pagination.pageSize)}
            onChange={(event) => table.setPageSize(Number(event.target.value))}
            className="h-8 w-20 text-xs"
          >
            {[5, 10, 20, 30].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
          <span className="px-2 text-xs text-zinc-400">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
