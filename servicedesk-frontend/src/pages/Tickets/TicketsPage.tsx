import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayot from "../../components/AppLayot";
import TicketSubmitionPannel from "../../features/ticket-submission/TicketSubmissionPanel";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
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

type ApiTicket = {
  id: number;
  ticketNumber?: number;
  requesterName: string;
  productName: string;
  channel: string;
  priority: string;
  status: string;
  createdAt: string;
};

type UiTicket = {
  id: string;
  rawId: number;
  requester: string;
  product: string;
  channel: string;
  priority: string;
  status: string;
  date: string;
};

const priorityOptions = ["Critical", "High", "Medium", "Low"];
const statusOptions = [
  "New",
  "Open",
  "Assigned",
  "In Progress",
  "Waiting for Parts",
  "Escalated",
  "Resolved",
  "Closed",
];
const channelOptions = [
  "Phone",
  "Web",
  "Email",
  "Voice",
  "Store",
  "Marketplace",
];

function toTitleCase(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizePriority(value: string): string {
  const normalized = toTitleCase(value);
  if (priorityOptions.includes(normalized)) return normalized;
  return normalized;
}

function normalizeStatus(value: string): string {
  const normalized = toTitleCase(value);
  if (normalized === "Inprogress") return "In Progress";
  if (statusOptions.includes(normalized)) return normalized;
  return normalized;
}

function normalizeChannel(value: string): string {
  const normalized = toTitleCase(value);
  if (channelOptions.includes(normalized)) return normalized;
  return normalized;
}

export default function TicketsPage() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState<UiTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const [isTicketPanelOpen, setIsTicketPanelOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [channels, setChannels] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("Newest first");

  useEffect(() => {
    const loadTickets = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch("http://localhost:8080/api/tickets");

        if (!response.ok) {
          throw new Error(`Failed to load tickets. Status: ${response.status}`);
        }

        const data: ApiTicket[] = await response.json();

        const mapped: UiTicket[] = data.map((ticket) => ({
          id: `#${ticket.ticketNumber ?? ticket.id}`,
          rawId: ticket.id,
          requester: ticket.requesterName,
          product: ticket.productName,
          channel: normalizeChannel(ticket.channel),
          priority: normalizePriority(ticket.priority),
          status: normalizeStatus(ticket.status),
          date: new Date(ticket.createdAt).toISOString().slice(0, 10),
        }));

        setTickets(mapped);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadTickets();
  }, []);

  const openTicket = (ticketId: number) => {
    navigate(`/agent/tickets/${ticketId}`, {
      state: {
        allowReply: false,
        source: "tickets",
        viewerType: "agent",
        viewerUserId: 0,
        viewerName: "Viewer mode",
      },
    });
  };

  const toggleValue = (
    value: string,
    list: string[],
    setter: (next: string[]) => void,
  ) => {
    setter(
      list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value],
    );
  };

  const filteredTickets = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const result = tickets.filter((ticket) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          ticket.id,
          ticket.requester,
          ticket.product,
          ticket.channel,
          ticket.priority,
          ticket.status,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesPriority =
        priorities.length === 0 || priorities.includes(ticket.priority);
      const matchesStatus =
        statuses.length === 0 || statuses.includes(ticket.status);
      const matchesChannel =
        channels.length === 0 || channels.includes(ticket.channel);

      return (
        matchesSearch && matchesPriority && matchesStatus && matchesChannel
      );
    });

    return result.sort((a, b) => {
      if (sortBy === "Newest first") return b.date.localeCompare(a.date);
      if (sortBy === "Oldest first") return a.date.localeCompare(b.date);
      if (sortBy === "Priority")
        return (
          priorityOptions.indexOf(a.priority) -
          priorityOptions.indexOf(b.priority)
        );
      return a.id.localeCompare(b.id);
    });
  }, [tickets, search, priorities, statuses, channels, sortBy]);

  const activeFilterCount =
    priorities.length + statuses.length + channels.length;

  const pillClass = (active: boolean) =>
    `rounded-lg border px-2.5 py-1.5 text-xs transition ${
      active
        ? "border-emerald-600/70 bg-emerald-600/20 text-emerald-300"
        : "border-zinc-700 bg-zinc-950 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100"
    }`;

  const badgeVariant = (
    value: string,
    type: "priority" | "status",
  ): "danger" | "warning" | "secondary" | "success" | "info" => {
    if (type === "priority") {
      if (value === "Critical") return "danger";
      if (value === "High") return "warning";
      if (value === "Medium") return "warning";
      return "secondary";
    }

    if (value === "Resolved" || value === "Closed") return "success";
    if (value === "Escalated") return "danger";
    if (value === "In Progress") return "info";
    return "secondary";
  };

  return (
    <AppLayot
      title="Tickets"
      subtitle="Browse all faulty-product service requests and narrow them down with quick filters."
      action={
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ticket, requester, product..."
            className="w-full bg-slate-50 md:w-80"
          />
          <Button
            onClick={() => setIsTicketPanelOpen(true)}
            className="border-emerald-500 bg-emerald-600 text-white shadow-lg shadow-emerald-900/40 ring-1 ring-emerald-500/40 transition-all hover:border-emerald-400 hover:bg-emerald-500 hover:shadow-emerald-500/35"
          >
            New Ticket
          </Button>
        </div>
      }
    >
      <section className="p-6">
        <div className="space-y-4">
          <div className="rounded-md border border-zinc-800 bg-zinc-900 p-4 shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-lg font-semibold text-slate-900">
                  Library Filters
                </div>
                <div className="text-xs text-slate-500">
                  Narrow your ticket list quickly.
                </div>
              </div>
              <Button
                onClick={() => setIsFiltersOpen((v) => !v)}
                variant="outline"
                size="sm"
              >
                {isFiltersOpen ? "Collapse" : "Expand"}
              </Button>
            </div>

            {isFiltersOpen && (
              <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Priority
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {priorityOptions.map((item) => (
                      <button
                        key={item}
                        onClick={() =>
                          toggleValue(item, priorities, setPriorities)
                        }
                        className={pillClass(priorities.includes(item))}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Status
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {statusOptions.map((item) => (
                      <button
                        key={item}
                        onClick={() => toggleValue(item, statuses, setStatuses)}
                        className={pillClass(statuses.includes(item))}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Channel
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {channelOptions.map((item) => (
                      <button
                        key={item}
                        onClick={() => toggleValue(item, channels, setChannels)}
                        className={pillClass(channels.includes(item))}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Sorting
                    </div>
                    <Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="h-9 bg-slate-50 text-sm"
                    >
                      <option>Newest first</option>
                      <option>Oldest first</option>
                      <option>Priority</option>
                      <option>Ticket number</option>
                    </Select>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      onClick={() => {
                        setPriorities([]);
                        setStatuses([]);
                        setChannels([]);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Clear all
                    </Button>
                    <Button
                      onClick={() => {
                        setPriorities(["Critical", "High"]);
                        setStatuses(["New", "Open", "In Progress", "Escalated"]);
                        setChannels([]);
                      }}
                      variant="secondary"
                      size="sm"
                    >
                      Triage preset
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 rounded-md border border-zinc-800 bg-zinc-900 p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm text-slate-500">Showing results</div>
              <div className="mt-1 text-2xl font-semibold">
                {isLoading ? "Loading..." : `${filteredTickets.length} tickets`}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {activeFilterCount > 0 ? (
                <>
                  {priorities.map((item) => (
                    <Badge
                      key={item}
                      variant="default"
                    >
                      Priority: {item}
                    </Badge>
                  ))}
                  {statuses.map((item) => (
                    <Badge
                      key={item}
                      variant="secondary"
                    >
                      Status: {item}
                    </Badge>
                  ))}
                  {channels.map((item) => (
                    <Badge
                      key={item}
                      variant="info"
                    >
                      Channel: {item}
                    </Badge>
                  ))}
                </>
              ) : (
                <Badge variant="secondary">
                  No filters selected
                </Badge>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="overflow-hidden rounded-md border border-zinc-800 bg-black shadow-sm">
            <div className="overflow-x-auto">
              <Table className="min-w-[980px] text-left text-sm">
                <TableHeader className="bg-zinc-900/90">
                  <TableRow className="hover:bg-zinc-900/90">
                    <TableHead>Ticket num</TableHead>
                    <TableHead>Requester</TableHead>
                    <TableHead>Product name</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!isLoading && filteredTickets.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-10 text-center text-zinc-500"
                      >
                        No tickets found.
                      </TableCell>
                    </TableRow>
                  )}

                  {filteredTickets.map((ticket) => (
                    <TableRow
                      key={ticket.rawId}
                      onClick={() => openTicket(ticket.rawId)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openTicket(ticket.rawId);
                        }
                      }}
                      tabIndex={0}
                      className="cursor-pointer transition hover:bg-zinc-900/30 focus:bg-zinc-900/30 focus:outline-none"
                    >
                      <TableCell className="font-semibold text-zinc-100">
                        {ticket.id}
                      </TableCell>
                      <TableCell>{ticket.requester}</TableCell>
                      <TableCell className="text-zinc-400">
                        {ticket.product}
                      </TableCell>
                      <TableCell>{ticket.channel}</TableCell>
                      <TableCell>
                        <Badge variant={badgeVariant(ticket.priority, "priority")}>
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={badgeVariant(ticket.status, "status")}>
                          {ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-500">
                        {ticket.date}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </section>

      {isTicketPanelOpen && (
        <TicketSubmitionPannel
          open={isTicketPanelOpen}
          onClose={() => setIsTicketPanelOpen(false)}
        />
      )}
    </AppLayot>
  );
}
