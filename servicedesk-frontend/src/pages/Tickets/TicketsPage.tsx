import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayot from "../../components/AppLayot";
import TicketSubmitionPannel from "../../features/ticket-submission/TicketSubmissionPanel";

const allTickets = [
  {
    id: "#6201",
    requester: "Dana Levy",
    product: "Smart Blender X2",
    channel: "Phone",
    priority: "Critical",
    status: "Open",
    date: "2026-03-11",
  },
  {
    id: "#6198",
    requester: "Maya Cohen",
    product: "Air Purifier Pro",
    channel: "Web",
    priority: "High",
    status: "In Progress",
    date: "2026-03-10",
  },
  {
    id: "#6193",
    requester: "Amit Ben David",
    product: "Vacuum Cleaner S9",
    channel: "Email",
    priority: "Medium",
    status: "Waiting for Parts",
    date: "2026-03-09",
  },
  {
    id: "#6189",
    requester: "Noa Mizrahi",
    product: "Coffee Machine Elite",
    channel: "Voice",
    priority: "High",
    status: "New",
    date: "2026-03-11",
  },
  {
    id: "#6182",
    requester: "Yossi Green",
    product: "Robot Mop Mini",
    channel: "Store",
    priority: "Low",
    status: "Resolved",
    date: "2026-03-07",
  },
  {
    id: "#6176",
    requester: "Shira Azulay",
    product: "Portable Heater Go",
    channel: "Web",
    priority: "Critical",
    status: "Escalated",
    date: "2026-03-08",
  },
  {
    id: "#6170",
    requester: "Lior Kadosh",
    product: "Dishwasher Plus",
    channel: "Phone",
    priority: "Medium",
    status: "Assigned",
    date: "2026-03-06",
  },
  {
    id: "#6164",
    requester: "Roni Peretz",
    product: "Smart Kettle One",
    channel: "Marketplace",
    priority: "Low",
    status: "Closed",
    date: "2026-03-05",
  },
];

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

export default function TicketsPage() {
  const navigate = useNavigate();

  const openTicket = (ticketId: string) => {
    navigate(`/agent/tickets/${ticketId.replace("#", "")}`);
  };
  const [isTicketPanelOpen, setIsTicketPanelOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const [priorities, setPriorities] = useState<string[]>(["Critical", "High"]);
  const [statuses, setStatuses] = useState<string[]>([
    "New",
    "Open",
    "In Progress",
    "Escalated",
  ]);
  const [channels, setChannels] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("Newest first");

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

    const result = allTickets.filter((ticket) => {
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
  }, [search, priorities, statuses, channels, sortBy]);

  const activeFilterCount =
    priorities.length + statuses.length + channels.length;

  const pillClass = (active: boolean) =>
    `rounded-xl border px-3 py-2 text-sm transition ${
      active
        ? "border-slate-900 bg-slate-900 text-white shadow-sm"
        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
    }`;

  const badgeClass = (value: string, type: "priority" | "status") => {
    if (type === "priority") {
      if (value === "Critical") return "bg-rose-100 text-rose-700";
      if (value === "High") return "bg-orange-100 text-orange-700";
      if (value === "Medium") return "bg-amber-100 text-amber-700";
      return "bg-slate-100 text-slate-700";
    }

    if (value === "Resolved" || value === "Closed")
      return "bg-emerald-100 text-emerald-700";
    if (value === "Escalated") return "bg-rose-100 text-rose-700";
    if (value === "In Progress") return "bg-blue-100 text-blue-700";
    if (value === "Waiting for Parts") return "bg-violet-100 text-violet-700";
    return "bg-slate-100 text-slate-700";
  };

  return (
    <AppLayot
      title="Tickets"
      subtitle="Browse all faulty-product service requests and narrow them down with a Steam-inspired filter experience."
      action={
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ticket, requester, product..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 md:w-80"
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
      <section className="p-6">
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-3xl border border-slate-300 bg-[#3b3d46] p-5 text-slate-100 shadow-none">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold tracking-tight text-white">
                  Library Filters
                </div>
                <div className="mt-1 text-sm text-slate-300">
                  Ticket discovery, inspired by Steam’s filter panel.
                </div>
              </div>
              <button
                onClick={() => setIsFiltersOpen((v) => !v)}
                className="rounded-xl border border-slate-500 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-slate-700"
              >
                {isFiltersOpen ? "Collapse" : "Expand"}
              </button>
            </div>

            {isFiltersOpen && (
              <div className="mt-6 space-y-6">
                <div>
                  <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-sky-400">
                    Priority
                  </div>
                  <div className="grid grid-cols-2 gap-2">
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
                  <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-sky-400">
                    Status
                  </div>
                  <div className="grid gap-2">
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
                  <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-sky-400">
                    Channel
                  </div>
                  <div className="grid grid-cols-2 gap-2">
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

                <div>
                  <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-sky-400">
                    Sorting
                  </div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full rounded-xl border border-slate-600 bg-slate-700 px-3 py-2.5 text-sm text-white outline-none"
                  >
                    <option>Newest first</option>
                    <option>Oldest first</option>
                    <option>Priority</option>
                    <option>Ticket number</option>
                  </select>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-slate-600 pt-4">
                  <button
                    onClick={() => {
                      setPriorities([]);
                      setStatuses([]);
                      setChannels([]);
                    }}
                    className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-900"
                  >
                    Clear all filters
                  </button>
                  <button
                    onClick={() => {
                      setPriorities(["Critical", "High"]);
                      setStatuses(["New", "Open", "In Progress", "Escalated"]);
                      setChannels([]);
                    }}
                    className="rounded-xl border border-slate-500 px-3 py-2 text-sm text-slate-200"
                  >
                    Load triage preset
                  </button>
                </div>
              </div>
            )}
          </aside>

          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-3xl border border-slate-300 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-sm text-slate-500">Showing results</div>
                <div className="mt-1 text-2xl font-semibold">
                  {filteredTickets.length} tickets
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {activeFilterCount > 0 ? (
                  <>
                    {priorities.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white"
                      >
                        Priority: {item}
                      </span>
                    ))}
                    {statuses.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700"
                      >
                        Status: {item}
                      </span>
                    ))}
                    {channels.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700"
                      >
                        Channel: {item}
                      </span>
                    ))}
                  </>
                ) : (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    No filters selected
                  </span>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-5 py-4 font-medium">Ticket num</th>
                      <th className="px-5 py-4 font-medium">Requester</th>
                      <th className="px-5 py-4 font-medium">Product name</th>
                      <th className="px-5 py-4 font-medium">Channel</th>
                      <th className="px-5 py-4 font-medium">Priority</th>
                      <th className="px-5 py-4 font-medium">Status</th>
                      <th className="px-5 py-4 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.map((ticket) => (
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
                        className="cursor-pointer border-t transition hover:bg-slate-50/80 focus:bg-slate-50/80 focus:outline-none"
                      >
                        <td className="px-5 py-4 font-semibold text-slate-900">
                          {ticket.id}
                        </td>
                        <td className="px-5 py-4">{ticket.requester}</td>
                        <td className="px-5 py-4 text-slate-600">
                          {ticket.product}
                        </td>
                        <td className="px-5 py-4">{ticket.channel}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass(ticket.priority, "priority")}`}
                          >
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass(ticket.status, "status")}`}
                          >
                            {ticket.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-500">
                          {ticket.date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
    </AppLayot>
  );
}
