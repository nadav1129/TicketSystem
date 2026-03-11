import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayot from '../../components/AppLayot';

type PageMode = 'customer' | 'agent';

type Profile = {
  id: string;
  roleLabel: string;
  name: string;
  subtitle: string;
  email: string;
  phone: string;
  openTickets: number;
  totalTickets: number;
  waitingReplies: number;
  resolvedThisMonth: number;
  averageResolution: string;
};

type BaseTicket = {
  id: string;
  product: string;
  status: string;
  priority: string;
  date: string;
  image: string;
  unread: boolean;
};

type CustomerTicket = BaseTicket;

type AgentTicket = BaseTicket & {
  customer: string;
};

type Ticket = CustomerTicket | AgentTicket;

const customers: Profile[] = [
  {
    id: 'customer-1',
    roleLabel: 'Customer',
    name: 'Dana Levy',
    subtitle: 'Premium support customer',
    email: 'dana.levy@example.com',
    phone: '+972 54-321-7788',
    openTickets: 3,
    totalTickets: 12,
    waitingReplies: 2,
    resolvedThisMonth: 4,
    averageResolution: '2.4 days',
  },
  {
    id: 'customer-2',
    roleLabel: 'Customer',
    name: 'Maya Cohen',
    subtitle: 'Home appliances customer',
    email: 'maya.cohen@example.com',
    phone: '+972 54-112-8841',
    openTickets: 2,
    totalTickets: 9,
    waitingReplies: 1,
    resolvedThisMonth: 3,
    averageResolution: '1.9 days',
  },
  {
    id: 'customer-3',
    roleLabel: 'Customer',
    name: 'Amit Ben David',
    subtitle: 'Extended warranty customer',
    email: 'amit.bd@example.com',
    phone: '+972 52-662-1104',
    openTickets: 4,
    totalTickets: 15,
    waitingReplies: 3,
    resolvedThisMonth: 5,
    averageResolution: '2.8 days',
  },
];

const agents: Profile[] = [
  {
    id: 'agent-1',
    roleLabel: 'Agent',
    name: 'Shira Azulay',
    subtitle: 'Senior repair desk agent',
    email: 'shira.azulay@servicedesk.io',
    phone: '+972 52-891-4411',
    openTickets: 8,
    totalTickets: 34,
    waitingReplies: 5,
    resolvedThisMonth: 19,
    averageResolution: '1.7 days',
  },
  {
    id: 'agent-2',
    roleLabel: 'Agent',
    name: 'Lior Ben Ami',
    subtitle: 'Warranty support specialist',
    email: 'lior.benami@servicedesk.io',
    phone: '+972 50-421-9941',
    openTickets: 6,
    totalTickets: 27,
    waitingReplies: 2,
    resolvedThisMonth: 15,
    averageResolution: '1.4 days',
  },
  {
    id: 'agent-3',
    roleLabel: 'Agent',
    name: 'Noa Mizrahi',
    subtitle: 'Escalation desk agent',
    email: 'noa.mizrahi@servicedesk.io',
    phone: '+972 54-555-2114',
    openTickets: 10,
    totalTickets: 41,
    waitingReplies: 6,
    resolvedThisMonth: 21,
    averageResolution: '1.6 days',
  },
];

const customerTicketsByProfile: Record<string, CustomerTicket[]> = {
  'customer-1': [
    {
      id: '#6201',
      product: 'Smart Blender X2',
      status: 'Open',
      priority: 'Critical',
      date: '2026-03-11',
      image: 'SB',
      unread: true,
    },
    {
      id: '#6189',
      product: 'Coffee Machine Elite',
      status: 'New',
      priority: 'High',
      date: '2026-03-10',
      image: 'CM',
      unread: true,
    },
    {
      id: '#6142',
      product: 'Air Fryer Duo',
      status: 'Waiting for Pickup',
      priority: 'Medium',
      date: '2026-03-05',
      image: 'AF',
      unread: false,
    },
  ],
  'customer-2': [
    {
      id: '#6234',
      product: 'Air Purifier Pro',
      status: 'In Progress',
      priority: 'High',
      date: '2026-03-12',
      image: 'AP',
      unread: true,
    },
    {
      id: '#6177',
      product: 'Steam Iron Max',
      status: 'Open',
      priority: 'Medium',
      date: '2026-03-08',
      image: 'SI',
      unread: false,
    },
  ],
  'customer-3': [
    {
      id: '#6251',
      product: 'Vacuum Cleaner S9',
      status: 'Escalated',
      priority: 'Critical',
      date: '2026-03-12',
      image: 'VC',
      unread: true,
    },
    {
      id: '#6208',
      product: 'Portable Heater Go',
      status: 'Waiting for Parts',
      priority: 'Medium',
      date: '2026-03-10',
      image: 'PH',
      unread: true,
    },
    {
      id: '#6133',
      product: 'Coffee Machine Elite',
      status: 'Resolved',
      priority: 'Low',
      date: '2026-03-03',
      image: 'CM',
      unread: false,
    },
  ],
};

const agentTicketsByProfile: Record<string, AgentTicket[]> = {
  'agent-1': [
    {
      id: '#6201',
      customer: 'Dana Levy',
      product: 'Smart Blender X2',
      status: 'Open',
      priority: 'Critical',
      date: '2026-03-11',
      image: 'SB',
      unread: true,
    },
    {
      id: '#6198',
      customer: 'Maya Cohen',
      product: 'Air Purifier Pro',
      status: 'In Progress',
      priority: 'High',
      date: '2026-03-10',
      image: 'AP',
      unread: false,
    },
    {
      id: '#6193',
      customer: 'Amit Ben David',
      product: 'Vacuum Cleaner S9',
      status: 'Waiting for Parts',
      priority: 'Medium',
      date: '2026-03-09',
      image: 'VC',
      unread: true,
    },
    {
      id: '#6176',
      customer: 'Lior Kadosh',
      product: 'Portable Heater Go',
      status: 'Escalated',
      priority: 'Critical',
      date: '2026-03-08',
      image: 'PH',
      unread: true,
    },
  ],
  'agent-2': [
    {
      id: '#6250',
      customer: 'Noa Mizrahi',
      product: 'Steam Iron Max',
      status: 'Open',
      priority: 'Medium',
      date: '2026-03-12',
      image: 'SI',
      unread: false,
    },
    {
      id: '#6242',
      customer: 'Maya Cohen',
      product: 'Coffee Machine Elite',
      status: 'New',
      priority: 'High',
      date: '2026-03-11',
      image: 'CM',
      unread: true,
    },
    {
      id: '#6210',
      customer: 'Dana Levy',
      product: 'Air Fryer Duo',
      status: 'Waiting for Pickup',
      priority: 'Low',
      date: '2026-03-10',
      image: 'AF',
      unread: false,
    },
  ],
  'agent-3': [
    {
      id: '#6261',
      customer: 'Amit Ben David',
      product: 'Portable Heater Go',
      status: 'Escalated',
      priority: 'Critical',
      date: '2026-03-12',
      image: 'PH',
      unread: true,
    },
    {
      id: '#6238',
      customer: 'Dana Levy',
      product: 'Smart Blender X2',
      status: 'In Progress',
      priority: 'High',
      date: '2026-03-11',
      image: 'SB',
      unread: true,
    },
    {
      id: '#6202',
      customer: 'Maya Cohen',
      product: 'Air Purifier Pro',
      status: 'Waiting for Parts',
      priority: 'Medium',
      date: '2026-03-09',
      image: 'AP',
      unread: false,
    },
  ],
};

export default function MyTicketsPage() {
  const navigate = useNavigate();
  const [pageMode, setPageMode] = useState<PageMode>('customer');
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0].id);
  const [selectedAgentId, setSelectedAgentId] = useState(agents[0].id);
  const [search, setSearch] = useState('');

  const selectedProfileId =
    pageMode === 'customer' ? selectedCustomerId : selectedAgentId;

  const profile =
    pageMode === 'customer'
      ? customers.find((item) => item.id === selectedCustomerId) ?? customers[0]
      : agents.find((item) => item.id === selectedAgentId) ?? agents[0];

  const tickets: Ticket[] =
    pageMode === 'customer'
      ? customerTicketsByProfile[selectedCustomerId] ?? []
      : agentTicketsByProfile[selectedAgentId] ?? [];

  const filteredTickets: Ticket[] = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tickets;

    return tickets.filter((ticket) => {
      const values = [
        ticket.id,
        ticket.product,
        ticket.status,
        ticket.priority,
        ticket.date,
        'customer' in ticket ? ticket.customer : '',
      ]
        .join(' ')
        .toLowerCase();

      return values.includes(q);
    });
  }, [search, tickets]);

  const openTicket = (ticketId: string) => {
    const viewerType = pageMode === 'agent' ? 'agent' : 'customer';

    navigate(`/${viewerType}/tickets/${ticketId.replace('#', '')}`, {
      state: {
        allowReply: true,
        source: 'my-tickets',
      },
    });
  };

  const statusClass = (value: string) => {
    if (value === 'Open') return 'bg-blue-100 text-blue-700';
    if (value === 'New') return 'bg-sky-100 text-sky-700';
    if (value === 'In Progress') return 'bg-indigo-100 text-indigo-700';
    if (value === 'Escalated') return 'bg-rose-100 text-rose-700';
    if (value === 'Waiting for Parts' || value === 'Waiting for Pickup') {
      return 'bg-violet-100 text-violet-700';
    }
    if (value === 'Resolved') return 'bg-emerald-100 text-emerald-700';
    return 'bg-slate-100 text-slate-700';
  };

  const priorityClass = (value: string) => {
    if (value === 'Critical') return 'bg-rose-100 text-rose-700';
    if (value === 'High') return 'bg-orange-100 text-orange-700';
    if (value === 'Medium') return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <AppLayot
      title={pageMode === 'customer' ? 'Customer Profile' : 'Agent Workspace'}
      subtitle={`Focused page for all open tickets that belong to one ${
        pageMode === 'customer' ? 'customer' : 'agent'
      }.`}
      action={
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-2xl bg-slate-100 p-1">
            <button
              onClick={() => setPageMode('customer')}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                pageMode === 'customer'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Customer page
            </button>
            <button
              onClick={() => setPageMode('agent')}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                pageMode === 'agent'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Agent page
            </button>
          </div>

          <select
            value={selectedProfileId}
            onChange={(e) =>
              pageMode === 'customer'
                ? setSelectedCustomerId(e.target.value)
                : setSelectedAgentId(e.target.value)
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400"
          >
            {(pageMode === 'customer' ? customers : agents).map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ticket or product..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 md:w-72"
          />
        </div>
      }
    >
      <section className="space-y-6 p-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-300 bg-white">
          <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,0.95fr)]">
            <div className="flex gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900 text-lg font-semibold text-white">
                {profile.name
                  .split(' ')
                  .map((part) => part[0])
                  .join('')}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-semibold tracking-tight">
                    {profile.name}
                  </h2>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {profile.roleLabel}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{profile.subtitle}</p>

                <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                  <span>{profile.email}</span>
                  <span>{profile.phone}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-3.5">
                <div className="text-xs text-slate-500">Open tickets</div>
                <div className="mt-1.5 text-2xl font-semibold">
                  {profile.openTickets}
                </div>
              </div>
              <div className="rounded-3xl bg-slate-50 p-3.5">
                <div className="text-xs text-slate-500">Total tickets</div>
                <div className="mt-1.5 text-2xl font-semibold">
                  {profile.totalTickets}
                </div>
              </div>
              <div className="rounded-3xl bg-slate-50 p-3.5">
                <div className="text-xs text-slate-500">Waiting replies</div>
                <div className="mt-1.5 text-2xl font-semibold">
                  {profile.waitingReplies}
                </div>
              </div>
              <div className="rounded-3xl bg-slate-50 p-3.5">
                <div className="text-xs text-slate-500">Resolved this month</div>
                <div className="mt-1.5 text-2xl font-semibold">
                  {profile.resolvedThisMonth}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t bg-slate-50/80 px-5 py-3.5">
            <div className="flex flex-wrap gap-3 text-sm text-slate-600">
              <span className="rounded-full bg-white px-3 py-1.5">
                Average resolution: {profile.averageResolution}
              </span>
              <span className="rounded-full bg-white px-3 py-1.5">
                Unread updates: {tickets.filter((ticket) => ticket.unread).length}
              </span>
              <span className="rounded-full bg-white px-3 py-1.5">
                Showing open-ticket focused timeline
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-300 bg-white">
          <div className="flex items-center justify-between border-b px-6 py-5">
            <div>
              <h3 className="text-lg font-semibold">Open tickets list</h3>
              <p className="mt-1 text-sm text-slate-500">
                Customer view shows status, messages, and date. Agent view adds priority.
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {filteredTickets.length} rows
            </div>
          </div>

          <div className="divide-y">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => openTicket(ticket.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openTicket(ticket.id);
                  }
                }}
                tabIndex={0}
                className="relative cursor-pointer p-5 transition hover:bg-slate-50/70 focus:bg-slate-50/70 focus:outline-none"
              >
                {ticket.unread && (
                  <div className="absolute right-5 top-5 h-3 w-3 rounded-full bg-orange-400" />
                )}

                <div
                  className={`grid min-w-0 gap-4 pr-10 ${
                    pageMode === 'agent'
                      ? 'xl:grid-cols-[minmax(0,1.35fr)_140px_120px_140px_120px] xl:items-center'
                      : 'xl:grid-cols-[minmax(0,1.5fr)_140px_160px_120px] xl:items-center'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
                      {ticket.image}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-base font-semibold text-slate-900">
                          {ticket.id}
                        </div>
                        {pageMode === 'agent' && 'customer' in ticket && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {ticket.customer}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 truncate text-sm text-slate-600">
                        {ticket.product}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Status
                    </div>
                    <div className="mt-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(ticket.status)}`}
                      >
                        {ticket.status}
                      </span>
                    </div>
                  </div>

                  {pageMode === 'agent' && (
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Priority
                      </div>
                      <div className="mt-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${priorityClass(ticket.priority)}`}
                        >
                          {ticket.priority}
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Messages
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                      <span>{ticket.unread ? 'New message' : 'No new messages'}</span>
                      {ticket.unread && (
                        <span className="h-2.5 w-2.5 rounded-full bg-orange-400" />
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Date
                    </div>
                    <div className="mt-2 text-sm font-medium text-slate-700">
                      {ticket.date}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppLayot>
  );
}