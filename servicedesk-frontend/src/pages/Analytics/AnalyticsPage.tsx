import { useEffect, useMemo, useRef, useState } from "react";
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
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/card";
import { Select } from "@/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/ui/tabs";

type ApiTicket = {
  id: number;
  ticketNumber?: number;
  subject?: string;
  requesterName: string;
  assignedAgentName?: string;
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

type BreakdownCardProps = {
  title: string;
  description: string;
  items: { key: string; count: number }[];
};

const prioritySortOrder: Record<string, number> = {
  Urgent: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

const statusSortOrder: Record<string, number> = {
  Open: 0,
  "In Progress": 1,
  "Waiting Customer": 2,
  Resolved: 3,
  Closed: 4,
};

const channelSortOrder: Record<string, number> = {
  Web: 0,
  Email: 1,
  Voice: 2,
};

async function buildHttpError(response: Response, fallback: string): Promise<string> {
  let detail = "";

  try {
    const text = await response.text();
    if (text) {
      try {
        const parsed = JSON.parse(text) as
          | string
          | { message?: string; detail?: string; title?: string };

        if (typeof parsed === "string") {
          detail = parsed;
        } else {
          detail =
            parsed.message ??
            parsed.detail ??
            parsed.title ??
            text;
        }
      } catch {
        detail = text;
      }
    }
  } catch {
    // Ignore parse/read failures; fallback message is enough.
  }

  return detail ? `${fallback} (${detail})` : fallback;
}

function toTitleCase(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizePriority(value: string): string {
  return toTitleCase(value);
}

function normalizeStatus(value: string): string {
  return toTitleCase(value);
}

function normalizeChannel(value: string): string {
  return toTitleCase(value);
}

function formatDateOnly(value: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
}

function formatHours(value: number): string {
  return `${value.toFixed(2)}h`;
}

function getSelectedDays(chartRange: string): number {
  if (chartRange === "7d") return 7;
  if (chartRange === "30d") return 30;
  return 90;
}

function getPeriodLabel(days: number): string {
  if (days === 7) return "last 7 days";
  if (days === 30) return "last 30 days";
  return "last 90 days";
}

function sortOptionValues(values: string[], orderMap: Record<string, number>) {
  return [...new Set(values.filter(Boolean))].sort((left, right) => {
    const leftRank = orderMap[left] ?? Number.MAX_SAFE_INTEGER;
    const rightRank = orderMap[right] ?? Number.MAX_SAFE_INTEGER;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return left.localeCompare(right);
  });
}

function isResolvedStatus(status: string) {
  return status === "Resolved" || status === "Closed";
}

function isInProgressStatus(status: string) {
  return status === "In Progress" || status === "Waiting Customer";
}

function isOpenStatus(status: string) {
  return status === "Open" || isInProgressStatus(status);
}

function toAnalyticsTicket(ticket: ApiTicket): AnalyticsTicket {
  return {
    rawId: ticket.id,
    ticketNumber: `#${ticket.ticketNumber ?? ticket.id}`,
    subject: ticket.subject?.trim() || "No subject",
    requester: ticket.requesterName?.trim() || "Unknown requester",
    assignedAgent: ticket.assignedAgentName?.trim() || "Unassigned",
    product: ticket.productName?.trim() || "Unknown product",
    channel: normalizeChannel(ticket.channel),
    priority: normalizePriority(ticket.priority),
    status: normalizeStatus(ticket.status),
    date: formatDateOnly(ticket.createdAt),
  };
}

function getPrioritySortValue(priority: string): number {
  return prioritySortOrder[priority] ?? 999;
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

function BreakdownCard({ title, description, items }: BreakdownCardProps) {
  const { theme } = useTheme();
  const isLightTheme = theme === "light";

  return (
    <Card
      className={
        isLightTheme
          ? "border-[#cad5cc] bg-[#f4f7f4] shadow-[0_18px_36px_rgba(122,142,127,0.10)]"
          : "border-zinc-800/80 bg-zinc-950"
      }
    >
      <CardHeader className="pb-3">
        <CardTitle
          className={isLightTheme ? "text-base text-[#1e2a21]" : "text-base text-zinc-50"}
        >
          {title}
        </CardTitle>
        <CardDescription className={isLightTheme ? "text-[#657467]" : undefined}>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 && (
          <div
            className={
              isLightTheme
                ? "rounded-md border border-[#bdcabf] bg-[#dde5de] px-3 py-2 text-sm text-[#516052]"
                : "rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-500"
            }
          >
            No ticket activity for this period.
          </div>
        )}
        {items.map((item) => (
          <div
            key={item.key}
            className={
              isLightTheme
                ? "flex items-center justify-between rounded-md border border-[#667266] bg-[#778477] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                : "flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2"
            }
          >
            <span className={isLightTheme ? "text-sm text-[#102216]" : "text-sm text-zinc-200"}>
              {item.key}
            </span>
            <Badge
              variant="secondary"
              className={
                isLightTheme
                  ? "border border-[#edf3ee] bg-[#f8fbf8] text-[#263328] shadow-none"
                  : undefined
              }
            >
              {item.count}
            </Badge>
          </div>
        ))}
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
  const [isChartReady, setIsChartReady] = useState(false);

  const chartHostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = chartHostRef.current;

    if (!element) {
      return;
    }

    const updateSize = () => {
      const bounds = element.getBoundingClientRect();
      setIsChartReady(bounds.width > 0 && bounds.height > 0);
    };

    updateSize();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => updateSize());
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const loadPage = async () => {
      try {
        setIsLoading(true);
        setError("");

        const days = getSelectedDays(chartRange);

        const [ticketsResponse, analyticsResponse] = await Promise.all([
          fetch("http://localhost:8080/api/tickets"),
          fetch(`http://localhost:8080/api/analytics/tickets?days=${days}`),
        ]);

        if (!ticketsResponse.ok) {
          throw new Error(
            await buildHttpError(
              ticketsResponse,
              `Failed to load tickets. Status: ${ticketsResponse.status}`,
            ),
          );
        }

        if (!analyticsResponse.ok) {
          throw new Error(
            await buildHttpError(
              analyticsResponse,
              `Failed to load analytics. Status: ${analyticsResponse.status}`,
            ),
          );
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

  const priorityOptions = useMemo(
    () => sortOptionValues(tickets.map((ticket) => ticket.priority), prioritySortOrder),
    [tickets],
  );
  const statusOptions = useMemo(
    () => sortOptionValues(tickets.map((ticket) => ticket.status), statusSortOrder),
    [tickets],
  );
  const channelOptions = useMemo(
    () => sortOptionValues(tickets.map((ticket) => ticket.channel), channelSortOrder),
    [tickets],
  );

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = tickets.filter((ticket) => {
      const matchesTab =
        tab === "all" ||
        (tab === "open" && isOpenStatus(ticket.status)) ||
        (tab === "in-progress" && isInProgressStatus(ticket.status)) ||
        (tab === "resolved" && isResolvedStatus(ticket.status));

      const matchesSearch =
        query.length === 0 ||
        [
          ticket.ticketNumber,
          ticket.subject,
          ticket.requester,
          ticket.assignedAgent,
          ticket.product,
          ticket.channel,
          ticket.priority,
          ticket.status,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

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

    return [...filtered].sort((left, right) => {
      if (sortBy === "Newest first") return right.date.localeCompare(left.date);
      if (sortBy === "Oldest first") return left.date.localeCompare(right.date);
      if (sortBy === "Priority") {
        return getPrioritySortValue(left.priority) - getPrioritySortValue(right.priority);
      }

      return left.ticketNumber.localeCompare(right.ticketNumber);
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

  const selectedDays = analytics?.days ?? getSelectedDays(chartRange);
  const periodLabel = getPeriodLabel(selectedDays);

  const stats = useMemo(() => {
    if (!analytics) {
      return {
        totalTickets: "0",
        openTickets: "0",
        resolvedTickets: "0",
        urgentTickets: "0",
        avgFirstResponse: "0.00h",
        avgResolution: "0.00h",
      };
    }

    return {
      totalTickets: analytics.totalTickets.toLocaleString(),
      openTickets: analytics.openTickets.toLocaleString(),
      resolvedTickets: analytics.resolvedTickets.toLocaleString(),
      urgentTickets: analytics.urgentTickets.toLocaleString(),
      avgFirstResponse: formatHours(analytics.avgFirstResponseHours),
      avgResolution: formatHours(analytics.avgResolutionHours),
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
    navigate(`http://localhost:8080/agent/tickets/${ticketId}`, {
      state: {
        allowReply: false,
        source: "tickets",
        viewerType: "agent",
        viewerUserId: 0,
        viewerName: "Viewer mode",
      },
    });
  };

  return (
    <AppLayot
      title="Analytics"
      subtitle="Live ticket analytics backed by the API, with real KPIs, trend lines, and ticket drill-down."
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
            hint={`Created in the ${periodLabel}`}
            icon={Ticket}
          />
          <MetricCard
            title="Open Tickets"
            value={stats.openTickets}
            hint={`Still active from the ${periodLabel}`}
            icon={Clock3}
          />
          <MetricCard
            title="Resolved Tickets"
            value={stats.resolvedTickets}
            hint={`Resolved or closed in the ${periodLabel}`}
            icon={CheckCircle2}
          />
          <MetricCard
            title="Urgent Tickets"
            value={stats.urgentTickets}
            hint={`Urgent tickets created in the ${periodLabel}`}
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

            <div ref={chartHostRef} className="h-[360px] min-h-[360px] w-full min-w-0">
              {isChartReady && (
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
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-3">
          <BreakdownCard
            title="By Status"
            description={`Tickets created in the ${periodLabel}`}
            items={analytics?.byStatus ?? []}
          />
          <BreakdownCard
            title="By Priority"
            description={`Priority mix for the ${periodLabel}`}
            items={analytics?.byPriority ?? []}
          />
          <BreakdownCard
            title="By Channel"
            description={`Intake channels for the ${periodLabel}`}
            items={analytics?.byChannel ?? []}
          />
        </div>

        <AnalyticsDataTable
          data={filteredTickets}
          isLoading={isLoading}
          error={error}
          tab={tab}
          onTabChange={setTab}
          search={search}
          onSearchChange={setSearch}
          onOpenTicket={handleOpenTicket}
          onCreateTicket={() => setIsTicketPanelOpen(true)}
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
