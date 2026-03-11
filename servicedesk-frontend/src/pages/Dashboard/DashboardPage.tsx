import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayot from "../../components/AppLayot";
import TicketSubmitionPannel from "../../features/ticket-submission/TicketSubmissionPanel";

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
      },
    });
  };

  return (
    <AppLayot
      title="Support Dashboard"
      subtitle="Clean admin page using shadcn-style layout with Ant Design and MUI widgets."
      action={
        <div className="flex items-center gap-3">
          <input
            placeholder="Search tickets, users, tags..."
            className="w-72 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none ring-0 transition focus:border-slate-400"
          />
          <button
            onClick={() => setIsTicketPanelOpen(true)}
            className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
          >
            New Ticket
          </button>
        </div>
      }
    >
      <section className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-3xl border border-slate-300 bg-white p-5 shadow-none"
            >
              <div className="text-sm text-slate-500">{stat.label}</div>
              <div className="mt-2 text-3xl font-semibold tracking-tight">
                {stat.value}
              </div>
              <div className="mt-2 text-xs text-slate-400">{stat.hint}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="rounded-3xl border border-slate-300 bg-white p-5 shadow-none xl:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Incoming Requests</h2>
                <p className="text-sm text-slate-500">
                  Today’s active queue overview
                </p>
              </div>
              <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                Live
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-300">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Ticket</th>
                    <th className="px-4 py-3 font-medium">Requester</th>
                    <th className="px-4 py-3 font-medium">Subject</th>
                    <th className="px-4 py-3 font-medium">Channel</th>
                    <th className="px-4 py-3 font-medium">Priority</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      onClick={() => openTicket(ticket.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openTicket(ticket.id);
                        }
                      }}
                      tabIndex={0}
                      className="cursor-pointer border-t transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                    >
                      <td className="px-4 py-3 font-medium">{ticket.id}</td>
                      <td className="px-4 py-3">{ticket.requester}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {ticket.subject}
                      </td>
                      <td className="px-4 py-3">{ticket.channel}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            ticket.priority === "High"
                              ? "bg-rose-50 text-rose-700"
                              : ticket.priority === "Medium"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            ticket.status === "Resolved"
                              ? "bg-emerald-50 text-emerald-700"
                              : ticket.status === "In Progress"
                                ? "bg-blue-50 text-blue-700"
                                : ticket.status === "Waiting"
                                  ? "bg-violet-50 text-violet-700"
                                  : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-300 bg-white p-5 shadow-none">
              <h2 className="text-lg font-semibold">Accessibility Intake</h2>
              <p className="mt-1 text-sm text-slate-500">
                This block is meant for the voice-assisted ticket submission
                feature.
              </p>

              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                <div className="text-sm font-medium">Voice flow</div>
                <div className="mt-2 text-sm text-slate-500">
                  Press to talk, transcribe, classify urgency, and open a new
                  service request.
                </div>
                <button
                  onClick={() => {
                    setIsVoiceVisualizerOpen(true);
                    setVoiceState("listening");
                  }}
                  className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white"
                >
                  Start Voice Intake
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-300 bg-white p-5 shadow-none">
              <h2 className="text-lg font-semibold">Team Performance</h2>
              <p className="mt-1 text-sm text-slate-500">Quick KPI snapshot</p>

              <div className="mt-4 space-y-4">
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
              </div>
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

      {isVoiceVisualizerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-zinc-800 bg-[#111214] text-white shadow-2xl">
            <div className="p-5">
              <div className="text-3xl font-semibold tracking-tight">
                Audio Frequency Visualizer
              </div>
              <div className="mt-1 text-sm text-slate-400">
                Real-time frequency band visualization with animated state
                transitions
              </div>

              <div className="mt-5 rounded-3xl bg-zinc-900 p-4">
                <AudioFrequencyVisualizerDemo state={voiceState} />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 px-5 py-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setVoiceState("connecting")}
                  className={`rounded-xl px-3 py-1.5 text-sm ${
                    voiceState === "connecting"
                      ? "bg-zinc-700 text-white"
                      : "bg-zinc-800 text-zinc-300"
                  }`}
                >
                  Connecting
                </button>
                <button
                  onClick={() => setVoiceState("listening")}
                  className={`rounded-xl px-3 py-1.5 text-sm ${
                    voiceState === "listening"
                      ? "bg-zinc-700 text-white"
                      : "bg-zinc-800 text-zinc-300"
                  }`}
                >
                  Listening
                </button>
                <button
                  onClick={() => setVoiceState("speaking")}
                  className={`rounded-xl px-3 py-1.5 text-sm ${
                    voiceState === "speaking"
                      ? "bg-white text-zinc-900"
                      : "bg-zinc-800 text-zinc-300"
                  }`}
                >
                  Speaking
                </button>
              </div>

              <button
                onClick={() => setIsVoiceVisualizerOpen(false)}
                className="rounded-xl border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300"
              >
                Close
              </button>
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