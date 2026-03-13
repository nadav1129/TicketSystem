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
import { ArrowUpRight, ArrowDownRight, Users, Activity, TrendingUp, Wallet } from "lucide-react";
import AppLayot from "../../components/AppLayot";
import TicketSubmitionPannel from "../../features/ticket-submission/TicketSubmissionPanel";
import AnalyticsDataTable from "./AnalyticsDataTable";
import type { AnalyticsFilterTab, AnalyticsTicket } from "./analytics.types";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card";
import { Select } from "../../ui/select";
import { Tabs, TabsList, TabsTrigger } from "../../ui/tabs";

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

type ChartPoint = {
  label: string;
  visitors: number;
  tickets: number;
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
const channelOptions = ["Phone", "Web", "Email", "Voice", "Store", "Marketplace"];
const sectionTypeOptions = ["Cover page", "Narrative", "Technical content", "Table of contents"];
const reviewerPool = ["Eddie Lake", "Jamik Tashpulatov", "Nadi Ibrahim"];

function toTitleCase(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeStatus(value: string): string {
  const normalized = toTitleCase(value);
  if (normalized === "Inprogress") return "In Progress";
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
    channel: toTitleCase(ticket.channel),
    priority: toTitleCase(ticket.priority),
    status: normalizeStatus(ticket.status),
    date: new Date(ticket.createdAt).toISOString().slice(0, 10),
    sectionType,
    target,
    limit,
    reviewer,
  };
}

function buildChartData(tickets: AnalyticsTicket[], range: string): ChartPoint[] {
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const now = new Date();

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (days - 1 - index));
    const key = date.toISOString().slice(5, 10);
    const dayTickets = tickets.filter((ticket) => ticket.date === date.toISOString().slice(0, 10)).length;

    return {
      label: key,
      visitors: 140 + ((index * 19) % 90) + dayTickets * 8,
      tickets: Math.max(4, dayTickets + ((index * 7) % 10)),
    };
  });
}

function MetricCard({
  title,
  value,
  hint,
  trend,
  positive,
  icon: Icon,
}: {
  title: string;
  value: string;
  hint: string;
  trend: string;
  positive: boolean;
  icon: typeof Wallet;
}) {
  return (
    <Card className="border-zinc-800/80 bg-gradient-to-b from-zinc-950 to-zinc-900/80 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardDescription className="text-sm text-zinc-400">{title}</CardDescription>
            <CardTitle className="mt-3 text-4xl font-semibold tracking-tight text-zinc-50">{value}</CardTitle>
          </div>
          <div className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${positive ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-amber-500/30 bg-amber-500/10 text-amber-300"}`}>
            {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {trend}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-3 pt-0">
        <div>
          <p className="text-sm font-medium text-zinc-100">{positive ? "Trending up this month" : "Needs attention"}</p>
          <p className="mt-1 text-sm text-zinc-500">{hint}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-300">
          <Icon className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  );
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
  const [chartRange, setChartRange] = useState("90d");

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
        setError(err instanceof Error ? err.message : "Unknown error occurred");
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
        (tab === "done" && (ticket.status === "Resolved" || ticket.status === "Closed")) ||
        (tab === "open" && (ticket.status === "Open" || ticket.status === "New"));

      const matchesSearch =
        q.length === 0 ||
        [ticket.ticketNumber, ticket.product, ticket.requester, ticket.reviewer, ticket.sectionType]
          .join(" ")
          .toLowerCase()
          .includes(q);

      const matchesPriority = priorities.length === 0 || priorities.includes(ticket.priority);
      const matchesStatus = statusFilter.length === 0 || ticket.status === statusFilter;
      const matchesChannel = channelFilter.length === 0 || ticket.channel === channelFilter;

      return matchesTab && matchesSearch && matchesPriority && matchesStatus && matchesChannel;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "Newest first") return b.date.localeCompare(a.date);
      if (sortBy === "Oldest first") return a.date.localeCompare(b.date);
      if (sortBy === "Priority") return priorityOptions.indexOf(a.priority) - priorityOptions.indexOf(b.priority);
      return a.ticketNumber.localeCompare(b.ticketNumber);
    });
  }, [tickets, tab, search, priorities, statusFilter, channelFilter, sortBy]);

  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((ticket) => ["New", "Open", "Assigned", "In Progress"].includes(ticket.status)).length;
    const resolved = tickets.filter((ticket) => ["Resolved", "Closed"].includes(ticket.status)).length;
    const critical = tickets.filter((ticket) => ticket.priority === "Critical").length;

    return {
      revenue: `$${(total * 78).toLocaleString()}.00`,
      newCustomers: String(open + 120),
      activeAccounts: (45678 + total).toLocaleString(),
      growthRate: `${Math.max(3.2, (resolved / Math.max(1, total)) * 100).toFixed(1)}%`,
      total,
      open,
      resolved,
      critical,
    };
  }, [tickets]);

  const chartData = useMemo(() => buildChartData(filteredTickets, chartRange), [filteredTickets, chartRange]);

  const togglePriority = (value: string) => {
    setPriorities((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
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
      current.map((ticket) => (ticket.rawId === ticketId ? { ...ticket, reviewer } : ticket)),
    );
  };

  return (
    <AppLayot
      title="Documents"
      subtitle="Modern analytics workspace with KPI cards, traffic chart and planning table."
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
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-8 w-36 text-xs">
            <option value="">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </Select>
          <Select value={channelFilter} onChange={(event) => setChannelFilter(event.target.value)} className="h-8 w-36 text-xs">
            <option value="">All channels</option>
            {channelOptions.map((channel) => (
              <option key={channel} value={channel}>{channel}</option>
            ))}
          </Select>
          <Select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="h-8 w-32 text-xs">
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
          <MetricCard title="Total Revenue" value={stats.revenue} trend="+12.5%" hint="Visitors for the last 6 months" positive icon={Wallet} />
          <MetricCard title="New Customers" value={stats.newCustomers} trend="-20%" hint="Acquisition needs attention" positive={false} icon={Users} />
          <MetricCard title="Active Accounts" value={stats.activeAccounts} trend="+12.5%" hint="Engagement exceed targets" positive icon={Activity} />
          <MetricCard title="Growth Rate" value={stats.growthRate} trend="+4.5%" hint="Meets growth projections" positive icon={TrendingUp} />
        </div>

        <Card className="border-zinc-800/80 bg-zinc-950">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="text-xl text-zinc-50">Total Visitors</CardTitle>
              <CardDescription>Total for the selected period</CardDescription>
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
            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="visitorsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#e5e7eb" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#e5e7eb" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="ticketsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a1a1aa" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#a1a1aa" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#27272a" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#a1a1aa", fontSize: 12 }} minTickGap={18} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: "#71717a", fontSize: 12 }} width={42} />
                  <Tooltip
                    contentStyle={{
                      background: "#09090b",
                      border: "1px solid #27272a",
                      borderRadius: 12,
                      color: "#fafafa",
                    }}
                  />
                  <Area type="monotone" dataKey="visitors" stroke="#f4f4f5" fill="url(#visitorsGradient)" strokeWidth={2} />
                  <Area type="monotone" dataKey="tickets" stroke="#a1a1aa" fill="url(#ticketsGradient)" strokeWidth={1.5} />
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
        <TicketSubmitionPannel open={isTicketPanelOpen} onClose={() => setIsTicketPanelOpen(false)} />
      )}
    </AppLayot>
  );
}
