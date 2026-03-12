import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayot from "../../components/AppLayot";
import TicketSubmitionPannel from "../../features/ticket-submission/TicketSubmissionPanel";
import AnalyticsDataTable from "./AnalyticsDataTable";
import type { AnalyticsFilterTab, AnalyticsTicket } from "./analytics.types";
import { Button } from "../../ui/button";
import { Select } from "../../ui/select";

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
const sectionTypeOptions = [
  "Cover page",
  "Narrative",
  "Technical content",
  "Table of contents",
];
const reviewerPool = [
  "Eddie Lake",
  "Jamik Tashpulatov",
  "Nadi Ibrahim",
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
  return normalized;
}

function normalizeStatus(value: string): string {
  const normalized = toTitleCase(value);
  if (normalized === "Inprogress") return "In Progress";
  return normalized;
}

function normalizeChannel(value: string): string {
  const normalized = toTitleCase(value);
  return normalized;
}

function toAnalyticsTicket(ticket: ApiTicket): AnalyticsTicket {
  const sectionType = sectionTypeOptions[ticket.id % sectionTypeOptions.length];
  const target = (ticket.id * 7) % 31 + 1;
  const limit = (ticket.id * 5) % 27 + 1;
  const reviewer = reviewerPool[ticket.id % reviewerPool.length];

  return {
    rawId: ticket.id,
    ticketNumber: `#${ticket.ticketNumber ?? ticket.id}`,
    requester: ticket.requesterName,
    product: ticket.productName,
    channel: normalizeChannel(ticket.channel),
    priority: normalizePriority(ticket.priority),
    status: normalizeStatus(ticket.status),
    date: new Date(ticket.createdAt).toISOString().slice(0, 10),
    sectionType,
    target,
    limit,
    reviewer,
  };
}

export default function AnalyticsPage() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState<AnalyticsTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<AnalyticsFilterTab>("all");
  const [priorities, setPriorities] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [sortBy, setSortBy] = useState("Newest first");
  const [isTicketPanelOpen, setIsTicketPanelOpen] = useState(false);

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
        setTickets(data.map(toAnalyticsTicket));
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

  const filteredTickets = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = tickets.filter((ticket) => {
      const matchesTab =
        tab === "all" ||
        (tab === "in-progress" && ticket.status === "In Progress") ||
        (tab === "done" &&
          (ticket.status === "Resolved" || ticket.status === "Closed")) ||
        (tab === "open" && (ticket.status === "Open" || ticket.status === "New"));

      const matchesSearch =
        q.length === 0 ||
        [
          ticket.ticketNumber,
          ticket.product,
          ticket.requester,
          ticket.reviewer,
          ticket.sectionType,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);

      const matchesPriority =
        priorities.length === 0 || priorities.includes(ticket.priority);

      const matchesStatus =
        statusFilter.length === 0 || ticket.status === statusFilter;
      const matchesChannel =
        channelFilter.length === 0 || ticket.channel === channelFilter;

      return (
        matchesTab &&
        matchesSearch &&
        matchesPriority &&
        matchesStatus &&
        matchesChannel
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "Newest first") return b.date.localeCompare(a.date);
      if (sortBy === "Oldest first") return a.date.localeCompare(b.date);
      if (sortBy === "Priority")
        return (
          priorityOptions.indexOf(a.priority) - priorityOptions.indexOf(b.priority)
        );
      return a.ticketNumber.localeCompare(b.ticketNumber);
    });
  }, [tickets, tab, search, priorities, statusFilter, channelFilter, sortBy]);

  const togglePriority = (value: string) => {
    setPriorities((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  const handleOpenTicket = (ticketId: number) => {
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

  const handleReviewerChange = (ticketId: number, reviewer: string) => {
    setTickets((current) =>
      current.map((ticket) =>
        ticket.rawId === ticketId ? { ...ticket, reviewer } : ticket,
      ),
    );
  };

  return (
    <AppLayot
      title="Analytics"
      subtitle="Dark shadcn-style planning table connected to live tickets API."
      action={
        <div className="flex flex-wrap items-center gap-2">
          {priorityOptions.map((priority) => (
            <Button
              key={priority}
              onClick={() => togglePriority(priority)}
              size="sm"
              variant="outline"
              className={`rounded-md border px-2 py-1 text-xs transition ${
                priorities.includes(priority)
                  ? "border-emerald-600 bg-emerald-600/20 text-emerald-300"
                  : "border-zinc-700 bg-zinc-950 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {priority}
            </Button>
          ))}
          <Select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-8 w-36 text-xs"
          >
            <option value="">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
          <Select
            value={channelFilter}
            onChange={(event) => setChannelFilter(event.target.value)}
            className="h-8 w-36 text-xs"
          >
            <option value="">All channels</option>
            {channelOptions.map((channel) => (
              <option key={channel} value={channel}>
                {channel}
              </option>
            ))}
          </Select>
          <Select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="h-8 w-32 text-xs"
          >
            <option>Newest first</option>
            <option>Oldest first</option>
            <option>Priority</option>
            <option>Ticket number</option>
          </Select>
        </div>
      }
    >
      <section className="space-y-4 p-6">
        <AnalyticsDataTable
          data={filteredTickets}
          isLoading={isLoading}
          error={error}
          tab={tab}
          onTabChange={setTab}
          search={search}
          onSearchChange={setSearch}
          onOpenTicket={handleOpenTicket}
          onReviewerChange={handleReviewerChange}
          onAddSection={() => setIsTicketPanelOpen(true)}
        />
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
