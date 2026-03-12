import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ListChecks,
  Settings,
  Sparkles,
  Ticket,
  ChartColumnBig,
} from "lucide-react";
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
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
  { label: "Analytics", to: "/analytics", icon: ChartColumnBig },
  { label: "My Tickets", to: "/my-tickets", icon: ListChecks },
  { label: "Settings", to: "/settings", icon: Settings },
];

export default function AppLayout({ title, subtitle, action, children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-zinc-900 bg-zinc-950 lg:block">
          <div className="border-b border-zinc-900 px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-emerald-300">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="text-lg font-semibold tracking-tight text-zinc-100">ServiceDesk</div>
                <div className="text-xs text-zinc-500">Prestige Control Center</div>
              </div>
            </div>
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
                        ? "border border-zinc-700 bg-zinc-900 text-zinc-100"
                        : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
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
          <header className="border-b border-zinc-900 bg-black px-6 py-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">{title}</h1>
                {subtitle ? <p className="mt-1 text-sm text-zinc-500">{subtitle}</p> : null}
              </div>
              {action ? <div className="shrink-0">{action}</div> : null}
            </div>
          </header>

          <main className="min-w-0 flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
