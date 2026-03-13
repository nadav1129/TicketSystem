import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ListChecks,
  MessageSquareText,
  Settings,
  Ticket,
  ChartColumnBig,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { cn } from "../lib/utils";

type AppLayoutProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
};

type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { label: "Home", to: "/dashboard", icon: LayoutDashboard },
  { label: "All Tickets", to: "/tickets", icon: Ticket },
  { label: "My Tickets", to: "/my-tickets", icon: ListChecks },
  { label: "Analytics", to: "/analytics", icon: ChartColumnBig },
  { label: "Chat Support", to: "/support/chat", icon: MessageSquareText },
  { label: "Settings", to: "/settings", icon: Settings },
];

export default function AppLayout({ title, subtitle, action, children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-zinc-800 bg-zinc-900 lg:block">
          <div className="flex h-24 items-center border-b border-zinc-800 px-6">
            <Link
              to="/"
              className="flex items-center gap-3 rounded-md transition hover:opacity-90"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-emerald-500/40 bg-zinc-900 text-zinc-100">
                <ScorpionMark />
              </div>
              <div>
                <div className="text-lg font-semibold tracking-tight text-zinc-100">TicketSystem</div>
                <div className="text-xs text-zinc-500">Prestige Control Center</div>
              </div>
            </Link>
          </div>

          <nav className="space-y-2 px-4 py-4">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium transition",
                      isActive
                        ? "border border-zinc-600 bg-zinc-800 text-zinc-100"
                        : "text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100",
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex min-h-24 items-center border-b border-zinc-800 bg-zinc-950 px-6 py-3">
            <div className="flex w-full flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <Link
                to="/"
                className="flex items-center gap-3 rounded-md lg:hidden"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-emerald-500/40 bg-zinc-900 text-zinc-100">
                  <ScorpionMark />
                </div>
                <div>
                  <div className="text-base font-semibold tracking-tight text-zinc-100">TicketSystem</div>
                  <div className="text-xs text-zinc-500">Prestige Control Center</div>
                </div>
              </Link>
              <div className="min-w-0">
                <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">{title}</h1>
                {subtitle ? <p className="mt-1 text-sm text-zinc-500">{subtitle}</p> : null}
              </div>
              {action ? <div className="min-w-0 w-full xl:w-auto xl:max-w-[65%]">{action}</div> : null}
            </div>
          </header>

          <main className="min-w-0 flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

function ScorpionMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 text-emerald-300"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14.7 9.2a6.2 6.2 0 0 1 4.8-4.6 2.4 2.4 0 0 1 2.2.7 2 2 0 0 1 0 2.9l-1.3 1.3" />
      <path d="M20.6 8.4 22 7" />
      <path d="M15 9.7a5.2 5.2 0 1 1-6.9 0" />
      <path d="M12 11.1c-1.4 0-2.5 1.1-2.5 2.5s1.1 2.5 2.5 2.5 2.5-1.1 2.5-2.5-1.1-2.5-2.5-2.5Z" />
      <path d="M10.2 9.6 7.8 8 5.6 9.2" />
      <path d="M8.8 12H5.9L4.4 13.4" />
      <path d="M8.9 14.5 6.6 16.1 4.7 15" />
      <path d="M15.1 14.5 17.4 16.1 19.3 15" />
      <path d="M15.2 12h2.9l1.5 1.4" />
      <path d="M12 9.1V7.7" />
      <path d="M12 19.2v1.8" />
      <circle cx="12" cy="13.6" r=".9" fill="currentColor" stroke="none" />
    </svg>
  );
}
