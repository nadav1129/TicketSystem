import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Ticket,
} from "lucide-react";

import AppLayot from "../../components/AppLayot";
import TicketSubmitionPannel from "../../features/ticket-submission/TicketSubmissionPanel";
import { useTheme, type AppTheme } from "../../theme/theme-provider";
import AnalyticsDataTable from "./AnalyticsDataTable";
import type { AnalyticsFilterTab, AnalyticsTicket } from "./analytics.types";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Select } from "@/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/ui/tabs";

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

type AnalyticsSummary = {
  days: number;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  urgentTickets: number;
  activeAgents: number;
  avgFirstResponseHours: number;
  avgResolutionHours: number;
  timeline: {
    label: string;
    ticketsCreated: number;
    ticketsResolved: number;
  }[];
  byStatus: {
    key: string;
    count: number;
  }[];
  byPriority: {
    key: string;
    count: number;
  }[];
  byChannel: {
    key: string;
    count: number;
  }[];
};

type ChartPoint = {
  label: string;
  created: number;
  resolved: number;
};

type ChartPalette = {
  createdStroke: string;
  createdFill: string;
  resolvedStroke: string;
  resolvedFill: string;
  grid: string;
  xTick: string;
  yTick: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
};

const priorityOptions = ["Urgent", "High", "Medium", "Low"];
const statusOptions = ["Open", "In Progress", "Waiting Customer", "Resolved", "Closed"];
const channelOptions = ["Web", "Email", "Voice"];

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
  if (normalized === "Urgent") return "Urgent";
  if (normalized === "High") return "High";
  if (normalized === "Medium") return "Medium";
  if (normalized === "Low") return "Low";
  return normalized;
}

function normalizeStatus(value: string): string {
  const normalized = toTitleCase(value);
  if (normalized === "Inprogress") return "In Progress";
  if (normalized === "Waitingcustomer") return "Waiting Customer";
  return normalized;
}

function normalizeChannel(value: string): string {
  return toTitleCase(value);
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

function getPrioritySortValue(priority: string): number {
  switch (priority) {
    case "Urgent":
      return 0;
    case "High":
      return 1;
    case "Medium":
      return 2;
    case "Low":
      return 3;
    default:
      return 999;
  }
}

function getChartPalette(theme: AppTheme): ChartPalette {
  if (theme === "light") {
    return {
      createdStroke: "#14532d",
      createdFill: "#22c55e",
      resolvedStroke: "#475569",
      resolvedFill: "#64748b",
      grid: "#c8d2cb",
      xTick: "#526072",
      yTick: "#64748b",
      tooltipBg: "#ffffff",
      tooltipBorder: "#c8d2cb",
      tooltipText: "#0f172a",
    };
  }

  if (theme === "khaki") {
    return {
      createdStroke: "#1f4f30",
      createdFill: "#3f8d55",
      resolvedStroke: "#4f4636",
      resolvedFill: "#6b5b45",
      grid: "#8f875a",
      xTick: "#564f33",
      yTick: "#6b6246",
      tooltipBg: "#d6cf9f",
      tooltipBorder: "#8f875a",
      tooltipText: "#1e1c14",
    };
  }

  return {
    createdStroke: "#f4f4f5",
    createdFill: "#e5e7eb",
    resolvedStroke: "#a1a1aa",
    resolvedFill: "#a1a1aa",
    grid: "#27272a",
    xTick: "#a1a1aa",
    yTick: "#71717a",
    tooltipBg: "#09090b",
    tooltipBorder: "#27272a",
    tooltipText: "#fafafa",
  };
}

function MetricCard({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string;
  value: string;
  hint: string;
  icon: typeof Ticket;
}) {
  return (
    <Card className="border-zinc-800/80 bg-zinc-900">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardDescription className="text-sm text-zinc-400">
              {title}
            </CardDescription>
            <CardTitle className="mt-3 text-4xl font-semibold tracking-tight text-zinc-50">
              {value}
            </CardTitle>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-300">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-zinc-500">{hint}</p>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [tickets, setTickets] = useState<AnalyticsTicket[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<AnalyticsFilterTab>("all");
  const [priorities, setPriorities] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [sortBy, setSortBy] = useState("Newest first");
  const [isTicketPanelOpen, setIsTicketPanelOpen] = useState(false);
  const [chartRange, setChartRange] = useState("90d");

  useEffect(() => {
    const loadPage = async () => {
      try {
        setIsLoading(true);
        setError("");

        const days = chartRange === "7d" ? 7 : chartRange === "30d" ? 30 : 90;

        const [ticketsResponse, analyticsResponse] = await Promise.all([
          fetch("/api/tickets"),
          fetch(`/api/analytics/tickets?days=${days}`),
        ]);

        if (!ticketsResponse.ok) {
          throw new Error(`Failed to load tickets. Status: ${ticketsResponse.status}`);
        }

        if (!analyticsResponse.ok) {
          throw new Error(`Failed to load analytics. Status: ${analyticsResponse.status}`);
        }

        const ticketsData: ApiTicket[] = await ticketsResponse.json();
        const analyticsData: AnalyticsSummary = await analyticsResponse.json();

        setTickets(ticketsData.map(toAnalyticsTicket));
        setAnalytics(analyticsData);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadPage();
  }, [chartRange]);

  const filteredTickets = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = tickets.filter((ticket) => {
      const matchesTab =
        tab === "all" ||
        (tab === "in-progress" && ticket.status === "In Progress") ||
        (tab === "done" &&
          (ticket.status === "Resolved" || ticket.status === "Closed")) ||
        (tab === "open" && ticket.status === "Open");

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
      if (sortBy === "Priority") {
        return getPrioritySortValue(a.priority) - getPrioritySortValue(b.priority);
      }
      return a.ticketNumber.localeCompare(b.ticketNumber);
    });
  }, [tickets, tab, search, priorities, statusFilter, channelFilter, sortBy]);

  const chartData = useMemo<ChartPoint[]>(() => {
    return (analytics?.timeline ?? []).map((item) => ({
      label: item.label,
      created: item.ticketsCreated,
      resolved: item.ticketsResolved,
    }));
  }, [analytics]);

  const chartPalette = useMemo(() => getChartPalette(theme), [theme]);
  const createdGradientId = `createdGradient-${theme}`;
  const resolvedGradientId = `resolvedGradient-${theme}`;

  const stats = useMemo(() => {
    if (!analytics) {
      return {
        totalTickets: "0",
        openTickets: "0",
        resolvedTickets: "0",
        urgentTickets: "0",
        avgFirstResponse: "0h",
        avgResolution: "0h",
      };
    }

    return {
      totalTickets: analytics.totalTickets.toLocaleString(),
      openTickets: analytics.openTickets.toLocaleString(),
      resolvedTickets: analytics.resolvedTickets.toLocaleString(),
      urgentTickets: analytics.urgentTickets.toLocaleString(),
      avgFirstResponse: `${analytics.avgFirstResponseHours}h`,
      avgResolution: `${analytics.avgResolutionHours}h`,
    };
  }, [analytics]);

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
      subtitle="Live ticket analytics with real KPIs, timeline trends, and the planning table."
      action={
        <div className="flex flex-wrap items-center gap-2">
          {priorityOptions.map((priority) => (
            <Button
              key={priority}
              onClick={() => togglePriority(priority)}
              size="sm"
              variant="outline"
              className={`h-8 rounded-md border px-2.5 text-xs ${
                priorities.includes(priority)
                  ? "border-emerald-600 bg-emerald-600/15 text-emerald-300"
                  : "border-zinc-700 bg-zinc-950 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {priority}
            </Button>
          ))}

          <Select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-8 w-40 text-xs"
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
            className="h-8 w-32 text-xs"
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
      <section className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total Tickets"
            value={stats.totalTickets}
            hint="All tickets in the system"
            icon={Ticket}
          />
          <MetricCard
            title="Open Tickets"
            value={stats.openTickets}
            hint="Currently requiring attention"
            icon={Clock3}
          />
          <MetricCard
            title="Resolved Tickets"
            value={stats.resolvedTickets}
            hint="Resolved or closed tickets"
            icon={CheckCircle2}
          />
          <MetricCard
            title="Urgent Tickets"
            value={stats.urgentTickets}
            hint="Highest-priority workload"
            icon={AlertTriangle}
          />
        </div>

        <Card className="border-zinc-800/80 bg-zinc-950">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="text-xl text-zinc-50">
                Ticket Activity
              </CardTitle>
              <CardDescription>
                Created vs resolved tickets for the selected period
              </CardDescription>
            </div>

            <Tabs value={chartRange} onValueChange={setChartRange}>
              <TabsList className="grid w-full grid-cols-3 md:w-[320px]">
                <TabsTrigger value="90d">Last 3 months</TabsTrigger>
                <TabsTrigger value="30d">Last 30 days</TabsTrigger>
                <TabsTrigger value="7d">Last 7 days</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent>
            <div className="mb-4 flex flex-wrap items-center gap-6 text-sm">
              <div>
                <span className="text-zinc-500">Avg first response: </span>
                <span className="font-medium text-zinc-100">
                  {stats.avgFirstResponse}
                </span>
              </div>
              <div>
                <span className="text-zinc-500">Avg resolution: </span>
                <span className="font-medium text-zinc-100">
                  {stats.avgResolution}
                </span>
              </div>
              <div>
                <span className="text-zinc-500">Active agents: </span>
                <span className="font-medium text-zinc-100">
                  {analytics?.activeAgents ?? 0}
                </span>
              </div>
            </div>

            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id={createdGradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartPalette.createdFill} stopOpacity={0.42} />
                      <stop offset="100%" stopColor={chartPalette.createdFill} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id={resolvedGradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartPalette.resolvedFill} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={chartPalette.resolvedFill} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid vertical={false} stroke={chartPalette.grid} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: chartPalette.xTick, fontSize: 12 }}
                    minTickGap={18}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: chartPalette.yTick, fontSize: 12 }}
                    width={42}
                  />
                  <Tooltip
                    contentStyle={{
                      background: chartPalette.tooltipBg,
                      border: `1px solid ${chartPalette.tooltipBorder}`,
                      borderRadius: 12,
                      color: chartPalette.tooltipText,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="created"
                    name="Created"
                    stroke={chartPalette.createdStroke}
                    fill={`url(#${createdGradientId})`}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="resolved"
                    name="Resolved"
                    stroke={chartPalette.resolvedStroke}
                    fill={`url(#${resolvedGradientId})`}
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

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
