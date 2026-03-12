import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ListChecks,
  Settings,
  Sparkles,
  Ticket,
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
  { label: "My Tickets", to: "/my-tickets", icon: ListChecks },
  { label: "Settings", to: "/settings", icon: Settings },
];

export default function AppLayout({ title, subtitle, action, children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-slate-200/80 bg-white/80 backdrop-blur-xl lg:block">
          <div className="border-b border-slate-200 px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="text-lg font-semibold tracking-tight text-slate-900">ServiceDesk</div>
                <div className="text-xs text-slate-500">Prestige Control Center</div>
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
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                      isActive
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
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
          <header className="border-b border-slate-200/80 bg-white/80 px-6 py-5 backdrop-blur-xl">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
                {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
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
