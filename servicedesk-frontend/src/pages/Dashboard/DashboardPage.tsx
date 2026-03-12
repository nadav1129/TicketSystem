import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayot from "../../components/AppLayot";
import TicketSubmitionPannel from "../../features/ticket-submission/TicketSubmissionPanel";
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

const stats = [
  { label: "Open Tickets", value: "128", hint: "+12 today" },
  { label: "Avg Response", value: "4m", hint: "-18% this week" },
  { label: "Resolved Today", value: "86", hint: "92% SLA" },
  { label: "Satisfaction", value: "4.8/5", hint: "241 reviews" },
];

const tickets = [
  {
    id: "#4821",
    requester: "Dana Levy",
    subject: "Wheelchair-accessible entrance issue",
    priority: "High",
    status: "In Progress",
    channel: "Voice",
  },
  {
    id: "#4817",
    requester: "Maya Cohen",
    subject: "Billing address update request",
    priority: "Medium",
    status: "Waiting",
    channel: "Web",
  },
  {
    id: "#4811",
    requester: "Amit Ben David",
    subject: "Login problem after password reset",
    priority: "High",
    status: "Open",
    channel: "Mobile",
  },
  {
    id: "#4802",
    requester: "Noa Mizrahi",
    subject: "Request for callback in Hebrew",
    priority: "Low",
    status: "Resolved",
    channel: "Phone",
  },
];

type VoiceState = "connecting" | "listening" | "speaking";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [isTicketPanelOpen, setIsTicketPanelOpen] = useState(false);
  const [isVoiceVisualizerOpen, setIsVoiceVisualizerOpen] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("connecting");

  const openTicket = (ticketId: string) => {
    navigate(`/agent/tickets/${ticketId.replace("#", "")}`, {
      state: {
        allowReply: false,
        source: "dashboard",
        viewerType: "agent",
        viewerUserId: 0,
        viewerName: "Viewer mode",
      },
    });
  };

  return (
    <AppLayot
      title="Support Dashboard"
      subtitle="Real-time operations view for support teams."
      action={
        <div className="flex items-center gap-3">
          <Input
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Incoming Requests</CardTitle>
                  <CardDescription className="mt-1">
                    Today's active queue overview
                  </CardDescription>
                </div>
                <Badge variant="success">Live</Badge>
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
                    {tickets.map((ticket) => (
                      <TableRow
                        key={ticket.id}
                        onClick={() => openTicket(ticket.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openTicket(ticket.id);
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
                          <Badge
                            variant={
                              ticket.priority === "High"
                                ? "danger"
                                : ticket.priority === "Medium"
                                  ? "warning"
                                  : "secondary"
                            }
                          >
                            {ticket.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              ticket.status === "Resolved"
                                ? "success"
                                : ticket.status === "In Progress"
                                  ? "info"
                                  : "secondary"
                            }
                          >
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
                <CardTitle className="text-lg">Team Performance</CardTitle>
                <CardDescription className="mt-1">Quick KPI snapshot</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>First response SLA</span>
                    <span className="font-medium">89%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 w-[89%] rounded-full bg-slate-900" />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>Resolution SLA</span>
                    <span className="font-medium">73%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 w-[73%] rounded-full bg-slate-900" />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>Accessibility requests handled</span>
                    <span className="font-medium">96%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 w-[96%] rounded-full bg-slate-900" />
                  </div>
                </div>
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
