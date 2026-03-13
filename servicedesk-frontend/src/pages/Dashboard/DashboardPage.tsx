import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayot from "../../components/AppLayot";
import TicketSubmitionPannel from "../../features/ticket-submission/TicketSubmissionPanel";
import { apiUrl } from "../../lib/api";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Input } from "../../ui/input";
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
  subject?: string;
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
};

type DashboardTicket = {
  rawId: number;
  id: string;
  requester: string;
  subject: string;
  channel: string;
  priority: string;
  status: string;
  createdAt: string;
};

type VoiceState = "connecting" | "listening" | "speaking";

const ANALYTICS_WINDOW_DAYS = 30;

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
  const normalized = toTitleCase(value);
  if (normalized === "Inprogress") return "In Progress";
  return normalized;
}

function normalizeChannel(value: string): string {
  return toTitleCase(value);
}

function isResolvedStatus(status: string): boolean {
  return status === "Resolved" || status === "Closed";
}

function formatHours(value: number): string {
  return `${value.toFixed(2)}h`;
}

function getPeriodLabel(days: number): string {
  if (days === 7) return "last 7 days";
  if (days === 30) return "last 30 days";
  return "last 90 days";
}

function getPriorityBadgeVariant(
  value: string,
): "danger" | "warning" | "secondary" {
  if (value === "Urgent" || value === "Critical") return "danger";
  if (value === "High" || value === "Medium") return "warning";
  return "secondary";
}

function getStatusBadgeVariant(
  value: string,
): "success" | "info" | "danger" | "secondary" {
  if (value === "Resolved" || value === "Closed") return "success";
  if (value === "In Progress" || value === "Waiting Customer") return "info";
  if (value === "Escalated") return "danger";
  return "secondary";
}

function toDashboardTicket(ticket: ApiTicket): DashboardTicket {
  return {
    rawId: ticket.id,
    id: `#${ticket.ticketNumber ?? ticket.id}`,
    requester: ticket.requesterName?.trim() || "Unknown requester",
    subject: ticket.subject?.trim() || ticket.productName?.trim() || "No subject",
    channel: normalizeChannel(ticket.channel),
    priority: normalizePriority(ticket.priority),
    status: normalizeStatus(ticket.status),
    createdAt: ticket.createdAt,
  };
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [tickets, setTickets] = useState<DashboardTicket[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isTicketPanelOpen, setIsTicketPanelOpen] = useState(false);
  const [isVoiceVisualizerOpen, setIsVoiceVisualizerOpen] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("connecting");

  useEffect(() => {
    let isDisposed = false;

    const loadTickets = async (): Promise<{
      data: DashboardTicket[];
      error: string;
    }> => {
      try {
        const response = await fetch(apiUrl("/api/tickets"));

        if (!response.ok) {
          throw new Error(
            await buildHttpError(
              response,
              `Failed to load tickets. Status: ${response.status}`,
            ),
          );
        }

        const data: ApiTicket[] = await response.json();
        return {
          data: data.map(toDashboardTicket),
          error: "",
        };
      } catch (err) {
        return {
          data: [],
          error:
            err instanceof Error ? err.message : "Failed to load tickets.",
        };
      }
    };

    const loadAnalytics = async (): Promise<{
      data: AnalyticsSummary | null;
      error: string;
    }> => {
      try {
        const response = await fetch(
          apiUrl(`/api/analytics/tickets?days=${ANALYTICS_WINDOW_DAYS}`),
        );

        if (!response.ok) {
          throw new Error(
            await buildHttpError(
              response,
              `Failed to load analytics. Status: ${response.status}`,
            ),
          );
        }

        const data: AnalyticsSummary = await response.json();
        return { data, error: "" };
      } catch (err) {
        return {
          data: null,
          error:
            err instanceof Error ? err.message : "Failed to load analytics.",
        };
      }
    };

    const loadDashboard = async () => {
      setIsLoading(true);
      setError("");

      const [ticketsResult, analyticsResult] = await Promise.all([
        loadTickets(),
        loadAnalytics(),
      ]);

      if (isDisposed) {
        return;
      }

      setTickets(ticketsResult.data);
      setAnalytics(analyticsResult.data);

      const nextError = [ticketsResult.error, analyticsResult.error]
        .filter(Boolean)
        .join(" ");

      setError(nextError);
      setIsLoading(false);
    };

    void loadDashboard();

    return () => {
      isDisposed = true;
    };
  }, []);

  const openTicket = (ticketId: number) => {
    navigate(`/agent/tickets/${ticketId}`, {
      state: {
        allowReply: false,
        source: "dashboard",
        viewerType: "agent",
        viewerUserId: 0,
        viewerName: "Viewer mode",
      },
    });
  };

  const normalizedSearch = search.trim().toLowerCase();
  const filteredTickets = tickets.filter((ticket) => {
    if (normalizedSearch.length === 0) {
      return true;
    }

    return [
      ticket.id,
      ticket.requester,
      ticket.subject,
      ticket.channel,
      ticket.priority,
      ticket.status,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch);
  });

  const visibleTickets = filteredTickets.slice(0, 6);
  const openTickets = tickets.filter((ticket) => !isResolvedStatus(ticket.status)).length;
  const latestTimelinePoint =
    analytics && analytics.timeline.length > 0
      ? analytics.timeline[analytics.timeline.length - 1]
      : null;
  const analyticsDays = analytics?.days ?? ANALYTICS_WINDOW_DAYS;
  const periodLabel = getPeriodLabel(analyticsDays);
  const statusBreakdown = analytics?.byStatus.slice(0, 4) ?? [];
  const stats = [
    {
      label: "Open Tickets",
      value: isLoading ? "..." : openTickets.toLocaleString(),
      hint: isLoading
        ? "Loading live queue"
        : `${tickets.length.toLocaleString()} total tickets loaded`,
    },
    {
      label: "Resolved Today",
      value: isLoading
        ? "..."
        : (latestTimelinePoint?.ticketsResolved ?? 0).toLocaleString(),
      hint: isLoading
        ? "Loading throughput"
        : `${(latestTimelinePoint?.ticketsCreated ?? 0).toLocaleString()} created today`,
    },
    {
      label: "Avg Response",
      value: isLoading || !analytics ? "..." : formatHours(analytics.avgFirstResponseHours),
      hint: isLoading || !analytics
        ? "Loading response time"
        : `Avg resolution ${formatHours(analytics.avgResolutionHours)}`,
    },
    {
      label: "Active Agents",
      value: isLoading || !analytics ? "..." : analytics.activeAgents.toLocaleString(),
      hint: isLoading || !analytics
        ? "Loading staffing"
        : `${analytics.urgentTickets.toLocaleString()} urgent in ${periodLabel}`,
    },
  ];

  return (
    <AppLayot
      title="Support Dashboard"
      subtitle="Live operations view backed by ticket and analytics APIs."
      action={
        <div className="flex items-center gap-3">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tickets, users, tags..."
            className="w-72 bg-slate-50"
          />
          <Button
            onClick={() => setIsTicketPanelOpen(true)}
            className="shrink-0 whitespace-nowrap border-emerald-500 bg-emerald-600 text-white shadow-lg shadow-emerald-900/40 ring-1 ring-emerald-500/40 transition-all hover:border-emerald-400 hover:bg-emerald-500 hover:shadow-emerald-500/35"
          >
            New Ticket
          </Button>
        </div>
      }
    >
      <section className="space-y-6 p-6">
        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="rounded-3xl border-slate-200">
              <CardContent className="p-5 pt-5">
                <div className="text-sm text-slate-500">{stat.label}</div>
                <div className="mt-2 text-3xl font-semibold tracking-tight">
                  {stat.value}
                </div>
                <div className="mt-2 text-xs text-slate-400">{stat.hint}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="rounded-3xl border-slate-200 xl:col-span-2">
            <CardHeader className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">Incoming Requests</CardTitle>
                  <CardDescription className="mt-1">
                    Recent live queue items filtered from the tickets API.
                  </CardDescription>
                </div>
                <Badge variant="success">
                  {isLoading ? "Loading" : `${filteredTickets.length} match${filteredTickets.length === 1 ? "" : "es"}`}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="overflow-hidden rounded-md border border-zinc-800">
                <Table className="text-left text-sm">
                  <TableHeader className="bg-zinc-900/90">
                    <TableRow className="hover:bg-zinc-900/90">
                      <TableHead>Ticket</TableHead>
                      <TableHead>Requester</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading && (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="py-10 text-center text-zinc-500"
                        >
                          Loading dashboard tickets...
                        </TableCell>
                      </TableRow>
                    )}

                    {!isLoading && visibleTickets.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="py-10 text-center text-zinc-500"
                        >
                          No tickets found.
                        </TableCell>
                      </TableRow>
                    )}

                    {visibleTickets.map((ticket) => (
                      <TableRow
                        key={ticket.rawId}
                        onClick={() => openTicket(ticket.rawId)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            openTicket(ticket.rawId);
                          }
                        }}
                        tabIndex={0}
                        className="cursor-pointer transition hover:bg-zinc-900/30 focus:bg-zinc-900/30 focus:outline-none"
                      >
                        <TableCell className="font-medium">{ticket.id}</TableCell>
                        <TableCell>{ticket.requester}</TableCell>
                        <TableCell className="text-zinc-400">{ticket.subject}</TableCell>
                        <TableCell>{ticket.channel}</TableCell>
                        <TableCell>
                          <Badge variant={getPriorityBadgeVariant(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(ticket.status)}>
                            {ticket.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-3xl border-slate-200">
              <CardHeader className="p-5">
                <CardTitle className="text-lg">Accessibility Intake</CardTitle>
                <CardDescription className="mt-1">
                  This block is meant for the voice-assisted ticket submission feature.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                  <div className="text-sm font-medium">Voice flow</div>
                  <div className="mt-2 text-sm text-slate-500">
                    Press to talk, transcribe, classify urgency, and open a new service request.
                  </div>
                  <Button
                    onClick={() => {
                      setIsVoiceVisualizerOpen(true);
                      setVoiceState("listening");
                    }}
                    className="mt-4 w-full"
                  >
                    Start Voice Intake
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200">
              <CardHeader className="p-5">
                <CardTitle className="text-lg">Status Breakdown</CardTitle>
                <CardDescription className="mt-1">
                  Analytics snapshot for the {periodLabel}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {statusBreakdown.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                    {isLoading ? "Loading analytics..." : "No analytics available."}
                  </div>
                ) : (
                  statusBreakdown.map((item) => {
                    const percent = analytics?.totalTickets
                      ? Math.round((item.count / analytics.totalTickets) * 100)
                      : 0;

                    return (
                      <div key={item.key}>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span>{item.key}</span>
                          <span className="font-medium">
                            {item.count} ({percent}%)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-slate-900"
                            style={{
                              width: `${Math.max(percent, item.count > 0 ? 8 : 0)}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {isTicketPanelOpen && (
        <TicketSubmitionPannel
          open={isTicketPanelOpen}
          onClose={() => setIsTicketPanelOpen(false)}
        />
      )}

      {isVoiceVisualizerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-zinc-800 bg-[#111214] text-white shadow-2xl">
            <div className="p-5">
              <div className="text-3xl font-semibold tracking-tight">
                Audio Frequency Visualizer
              </div>
              <div className="mt-1 text-sm text-slate-400">
                Real-time frequency band visualization with animated state transitions
              </div>

              <div className="mt-5 rounded-3xl bg-zinc-900 p-4">
                <AudioFrequencyVisualizerDemo state={voiceState} />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 px-5 py-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setVoiceState("connecting")}
                  variant="secondary"
                  size="sm"
                  className={
                    voiceState === "connecting"
                      ? "bg-zinc-700 text-white"
                      : "bg-zinc-800 text-zinc-300"
                  }
                >
                  Connecting
                </Button>
                <Button
                  onClick={() => setVoiceState("listening")}
                  variant="secondary"
                  size="sm"
                  className={
                    voiceState === "listening"
                      ? "bg-zinc-700 text-white"
                      : "bg-zinc-800 text-zinc-300"
                  }
                >
                  Listening
                </Button>
                <Button
                  onClick={() => setVoiceState("speaking")}
                  variant="secondary"
                  size="sm"
                  className={
                    voiceState === "speaking"
                      ? "bg-white text-zinc-900"
                      : "bg-zinc-800 text-zinc-300"
                  }
                >
                  Speaking
                </Button>
              </div>

              <Button
                onClick={() => setIsVoiceVisualizerOpen(false)}
                variant="outline"
                size="sm"
                className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayot>
  );
}

function AudioFrequencyVisualizerDemo({ state }: { state: VoiceState }) {
  const barsByState: Record<VoiceState, number[]> = {
    connecting: [26, 22, 22, 30, 42, 56, 68, 76, 78, 76, 70, 60, 46, 34, 20, 20, 24, 34, 46, 60, 74, 76],
    listening: [18, 20, 20, 24, 30, 38, 48, 56, 58, 56, 52, 44, 36, 28, 18, 18, 24, 34, 46, 58, 60, 52],
    speaking: [34, 42, 48, 58, 66, 72, 68, 62, 54, 46, 38, 30, 24, 28, 36, 48, 60, 70, 76, 74, 66, 54],
  };

  const bars = barsByState[state];

  return (
    <div className="rounded-3xl bg-zinc-800/70 p-4">
      <div className="flex h-36 items-end gap-2 overflow-hidden rounded-2xl">
        {bars.map((height, index) => (
          <div
            key={`${state}-${index}`}
            className="w-3 flex-1 rounded-full bg-blue-500 transition-all duration-300"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </div>
  );
}
