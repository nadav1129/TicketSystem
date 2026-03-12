import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayot from '../../components/AppLayot';

type PageMode = 'customer' | 'agent';

type DbUser = {
  id: number;
  roleCode: string;
  roleLabel: string;
  name: string;
  email: string;
  phone: string;
};

type Ticket = {
  id: number;
  ticketNumber: number;
  product: string;
  status: string;
  priority: string;
  date: string;
  image: string;
  unread: boolean;
  customer?: string | null;
};

type MyTicketsResponse = {
  userId: number;
  viewerType: PageMode;
  name: string;
  roleLabel: string;
  subtitle: string;
  email: string;
  phone: string;
  openTickets: number;
  totalTickets: number;
  waitingReplies: number;
  resolvedThisMonth: number;
  averageResolution: string;
  tickets: Ticket[];
};

const emptyProfile: MyTicketsResponse = {
  userId: 0,
  viewerType: 'customer',
  name: '',
  roleLabel: '',
  subtitle: '',
  email: '',
  phone: '',
  openTickets: 0,
  totalTickets: 0,
  waitingReplies: 0,
  resolvedThisMonth: 0,
  averageResolution: '—',
  tickets: [],
};

export default function MyTicketsPage() {
  const navigate = useNavigate();

  const [pageMode, setPageMode] = useState<PageMode>('customer');
  const [users, setUsers] = useState<DbUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [profile, setProfile] = useState<MyTicketsResponse>(emptyProfile);
  const [search, setSearch] = useState('');
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [isTicketsLoading, setIsTicketsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsUsersLoading(true);
        setError('');
        setUsers([]);
        setSelectedUserId(null);
        setProfile({
          ...emptyProfile,
          viewerType: pageMode,
        });

        const response = await fetch(
          `http://localhost:8080/api/tickets/my-tickets/users?role=${pageMode}`,
        );

        if (!response.ok) {
          throw new Error(`Failed to load ${pageMode} users. Status: ${response.status}`);
        }

        const data: DbUser[] = await response.json();
        setUsers(data);

        if (data.length > 0) {
          setSelectedUserId(data[0].id);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unknown error occurred';
        setError(message);
      } finally {
        setIsUsersLoading(false);
      }
    };

    loadUsers();
  }, [pageMode]);

  useEffect(() => {
    if (selectedUserId == null) {
      return;
    }

    const loadMyTickets = async () => {
      try {
        setIsTicketsLoading(true);
        setError('');

        const response = await fetch(
          `http://localhost:8080/api/tickets/my-tickets/${pageMode}/${selectedUserId}`,
        );

        if (!response.ok) {
          throw new Error(`Failed to load tickets. Status: ${response.status}`);
        }

        const data: MyTicketsResponse = await response.json();
        setProfile(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unknown error occurred';
        setError(message);
      } finally {
        setIsTicketsLoading(false);
      }
    };

    loadMyTickets();
  }, [pageMode, selectedUserId]);

  const filteredTickets = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profile.tickets;

    return profile.tickets.filter((ticket) => {
      const values = [
        String(ticket.ticketNumber),
        ticket.product,
        ticket.status,
        ticket.priority,
        ticket.date,
        ticket.customer ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return values.includes(q);
    });
  }, [search, profile.tickets]);

  const openTicket = (ticket: Ticket) => {
    navigate(`/${pageMode}/tickets/${ticket.id}`, {
      state: {
        allowReply: true,
        source: 'my-tickets',
        viewerType: pageMode,
        viewerUserId: profile.userId,
        viewerName: profile.name,
        ticketNumber: ticket.ticketNumber,
      },
    });
  };

  const statusClass = (value: string) => {
    if (value === 'Open') return 'bg-blue-100 text-blue-700';
    if (value === 'New') return 'bg-sky-100 text-sky-700';
    if (value === 'In Progress') return 'bg-indigo-100 text-indigo-700';
    if (value === 'Escalated') return 'bg-rose-100 text-rose-700';
    if (value === 'Waiting for Parts' || value === 'Waiting for Pickup' || value === 'Waiting Customer') {
      return 'bg-violet-100 text-violet-700';
    }
    if (value === 'Resolved' || value === 'Closed') return 'bg-emerald-100 text-emerald-700';
    return 'bg-slate-100 text-slate-700';
  };

  const priorityClass = (value: string) => {
    if (value === 'Critical' || value === 'Urgent') return 'bg-rose-100 text-rose-700';
    if (value === 'High') return 'bg-orange-100 text-orange-700';
    if (value === 'Medium') return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-700';
  };

  const profileInitials =
    profile.name.trim().length > 0
      ? profile.name
          .split(' ')
          .map((part) => part[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : '--';

  return (
    <AppLayot
      title={pageMode === 'customer' ? 'Customer Profile' : 'Agent Workspace'}
      subtitle={`Focused page for all tickets that belong to one ${
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
            value={selectedUserId ?? ''}
            onChange={(e) => setSelectedUserId(Number(e.target.value))}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400"
            disabled={isUsersLoading || users.length === 0}
          >
            {users.length === 0 ? (
              <option value="">No users found</option>
            ) : (
              users.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))
            )}
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
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-[28px] border border-slate-300 bg-white">
          <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,0.95fr)]">
            <div className="flex gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900 text-lg font-semibold text-white">
                {profileInitials}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-semibold tracking-tight">
                    {isTicketsLoading ? 'Loading...' : profile.name || 'No profile selected'}
                  </h2>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {profile.roleLabel || (pageMode === 'customer' ? 'Customer' : 'Agent')}
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
                Unread updates: {profile.tickets.filter((ticket) => ticket.unread).length}
              </span>
              <span className="rounded-full bg-white px-3 py-1.5">
                Viewer mode: {pageMode}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-300 bg-white">
          <div className="flex items-center justify-between border-b px-6 py-5">
            <div>
              <h3 className="text-lg font-semibold">Connected tickets</h3>
              <p className="mt-1 text-sm text-slate-500">
                Customer view shows the customer’s tickets. Agent view shows assigned tickets.
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {isTicketsLoading ? 'Loading...' : `${filteredTickets.length} rows`}
            </div>
          </div>

          <div className="divide-y">
            {!isTicketsLoading && filteredTickets.length === 0 && (
              <div className="px-6 py-12 text-center text-sm text-slate-500">
                No tickets found for this user.
              </div>
            )}

            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => openTicket(ticket)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openTicket(ticket);
                  }
                }}
                tabIndex={0}
                className="cursor-pointer px-6 py-4 transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-700">
                      {ticket.image}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900">
                          #{ticket.ticketNumber}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="truncate text-slate-700">{ticket.product}</span>
                        {ticket.unread && (
                          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-700">
                            New reply
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                        <span>{ticket.date}</span>
                        {pageMode === 'agent' && ticket.customer && (
                          <>
                            <span>•</span>
                            <span>{ticket.customer}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(ticket.status)}`}
                    >
                      {ticket.status}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${priorityClass(ticket.priority)}`}
                    >
                      {ticket.priority}
                    </span>
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