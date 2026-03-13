import * as React from "react"
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileText,
  HelpCircle,
  LifeBuoy,
  LogOut,
  Search,
  Settings,
  ShieldCheck,
  Ticket,
  User,
  X,
} from "lucide-react"

import * as Avatar from "@radix-ui/react-avatar"
import * as ContextMenu from "@radix-ui/react-context-menu"
import * as Dialog from "@radix-ui/react-dialog"
import * as ScrollArea from "@radix-ui/react-scroll-area"
import * as Separator from "@radix-ui/react-separator"
import * as Tabs from "@radix-ui/react-tabs"
import * as Tooltip from "@radix-ui/react-tooltip"

type ServiceId = "tickets" | "docs" | "manuals"
type CalendarView = "daily" | "weekly"

type ServiceDefinition = {
  id: ServiceId
  name: string
  subtitle: string
  icon: React.ElementType
  accent: string
  badge: string
  appUrl: string
  helpUrl: string
  openInNewTab?: boolean
}

const APP_CONFIG = {
  landingTitle: "Agilite Hub",
  ticketSystemUrl: import.meta.env.VITE_TICKET_SYSTEM_URL ?? "/tickets",
  docsUrl: import.meta.env.VITE_GITBOOK_DOCS_URL ?? "https://example.gitbook.io/agilite-docs",
  manualsUrl: import.meta.env.VITE_GITBOOK_MANUALS_URL ?? "https://example.gitbook.io/agilite-manuals",
  helpFallbackUrl: import.meta.env.VITE_GITBOOK_HELP_FALLBACK_URL ?? "https://example.gitbook.io/agilite-help",
  userName: import.meta.env.VITE_HUB_USER_NAME ?? "Nadav Hadar",
  tutorialStorageKey: "agilite-hub-tutorial-seen",
} as const

const weeklySchedule = [
  { day: "Sun", date: "14", label: "Mar 14", hours: ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00"] },
  { day: "Mon", date: "15", label: "Mar 15", hours: ["08:00", "09:30", "11:00", "12:30", "14:00", "15:30"] },
  { day: "Tue", date: "16", label: "Mar 16", hours: ["08:00", "09:00", "10:00", "13:00", "15:00", "16:00"] },
  { day: "Wed", date: "17", label: "Mar 17", hours: ["08:30", "10:00", "11:30", "13:00", "14:30", "16:00"] },
  { day: "Thu", date: "18", label: "Mar 18", hours: ["08:00", "09:00", "10:30", "12:00", "14:00", "15:00"] },
  { day: "Fri", date: "19", label: "Mar 19", hours: ["08:00", "09:00", "10:00", "11:00", "12:00"] },
]

const dailySchedule = [
  { time: "08:00", title: "Team sync" },
  { time: "09:30", title: "Ticket review" },
  { time: "11:00", title: "Customer callbacks" },
  { time: "13:00", title: "Documentation work" },
  { time: "15:00", title: "Manual updates" },
  { time: "16:30", title: "GitBook content planning" },
]

const services: ServiceDefinition[] = [
  {
    id: "tickets",
    name: "Ticket System",
    subtitle: "Support, SLA, conversations",
    icon: Ticket,
    accent: "from-cyan-400/24 via-sky-400/12 to-transparent",
    badge: "Core",
    appUrl: APP_CONFIG.ticketSystemUrl,
    helpUrl: APP_CONFIG.helpFallbackUrl,
  },
  {
    id: "docs",
    name: "Documentation",
    subtitle: "Architecture, API, setup",
    icon: FileText,
    accent: "from-violet-400/24 via-fuchsia-400/12 to-transparent",
    badge: "Docs",
    appUrl: APP_CONFIG.docsUrl,
    helpUrl: APP_CONFIG.helpFallbackUrl,
    openInNewTab: true,
  },
  {
    id: "manuals",
    name: "Manual Site",
    subtitle: "Guides, flows, training",
    icon: BookOpen,
    accent: "from-emerald-400/24 via-teal-400/12 to-transparent",
    badge: "Guide",
    appUrl: APP_CONFIG.manualsUrl,
    helpUrl: APP_CONFIG.helpFallbackUrl,
    openInNewTab: true,
  },
]

type ServiceCardProps = {
  service: ServiceDefinition
  highlighted?: boolean
  onOpen: (service: ServiceDefinition) => void
  onHelp: (service: ServiceDefinition) => void
}

function openUrl(url: string, newTab = false) {
  if (typeof window === "undefined") return

  if (newTab) {
    window.open(url, "_blank", "noopener,noreferrer")
    return
  }

  window.location.href = url
}

function LogoMark() {
  return (
    <div className="relative flex h-10 w-10 items-center justify-center rounded-[14px] bg-white/[0.08] ring-1 ring-white/10">
      <div className="absolute inset-[6px] rounded-[10px] bg-gradient-to-br from-cyan-300/90 via-sky-400/75 to-violet-400/85" />
      <div className="relative flex items-center gap-[3px]">
        <span className="h-3.5 w-1.5 rounded-full bg-white/95" />
        <span className="h-5.5 w-1.5 rounded-full bg-white/95" />
        <span className="h-2.5 w-1.5 rounded-full bg-white/95" />
      </div>
    </div>
  )
}

function ServiceCard({ service, highlighted = false, onOpen, onHelp }: ServiceCardProps) {
  const Icon = service.icon

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <button
          type="button"
          onClick={() => onOpen(service)}
          className={`group relative flex aspect-square min-h-[112px] w-full flex-col justify-between overflow-hidden rounded-[24px] p-3.5 text-left backdrop-blur-2xl transition duration-200 before:absolute before:inset-0 before:rounded-[24px] before:bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.03))] before:opacity-100 before:content-[''] ${
            highlighted
              ? "border border-cyan-200/28 bg-white/[0.09] shadow-[0_0_0_1px_rgba(186,230,253,0.14),0_14px_40px_-18px_rgba(56,189,248,0.45)] hover:-translate-y-1 hover:bg-white/[0.11] hover:shadow-[0_0_0_1px_rgba(186,230,253,0.22),0_18px_46px_-18px_rgba(56,189,248,0.55)]"
              : "border border-white/10 bg-white/[0.06] shadow-[0_8px_30px_-18px_rgba(0,0,0,0.55)] hover:-translate-y-0.5 hover:bg-white/[0.08] hover:shadow-[0_12px_34px_-18px_rgba(125,211,252,0.24)]"
          }`}
        >
          <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${service.accent} ${highlighted ? "opacity-100" : "opacity-80"}`} />
          <div className="pointer-events-none absolute inset-x-4 top-1 h-10 rounded-full bg-white/12 blur-2xl" />
          <div className={`pointer-events-none absolute inset-x-6 bottom-2 h-8 rounded-full blur-2xl ${highlighted ? "bg-cyan-200/18" : "bg-cyan-200/8"}`} />
          {highlighted ? (
            <>
              <div className="pointer-events-none absolute -inset-px rounded-[24px] ring-1 ring-cyan-200/28" />
              <div className="pointer-events-none absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-cyan-300/18 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-cyan-50 ring-1 ring-cyan-200/20 backdrop-blur-xl">
                Tap here
              </div>
              <div className="pointer-events-none absolute -right-1 -top-1 flex size-3 rounded-full bg-cyan-300 shadow-[0_0_0_6px_rgba(103,232,249,0.12)]" />
            </>
          ) : null}

          <div className="relative flex items-start justify-between gap-2">
            <div className="flex size-9 items-center justify-center rounded-[14px] bg-white/[0.12] ring-1 ring-white/16 shadow-inner shadow-white/10 backdrop-blur-xl">
              <Icon className="size-[18px] text-white/92" />
            </div>
            <div className={`rounded-full px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.2em] backdrop-blur-md ${highlighted ? "bg-cyan-300/16 text-cyan-50 ring-1 ring-cyan-200/18" : "bg-white/[0.08] text-white/54 ring-1 ring-white/10"}`}>
              {service.badge}
            </div>
          </div>

          <div className="relative space-y-0.5">
            <div className="flex items-center gap-1.5 text-[15px] font-medium tracking-tight text-white">
              <span>{service.name}</span>
              {highlighted ? <ArrowRight className="size-3.5 text-cyan-100/90" /> : null}
            </div>
            <div className="max-w-[12rem] text-[11px] leading-[18px] text-white/58">{service.subtitle}</div>
          </div>
        </button>
      </ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Content className="z-50 min-w-[180px] overflow-hidden rounded-2xl border border-white/10 bg-[#131928]/78 p-1 text-white shadow-2xl backdrop-blur-2xl">
          <ContextMenu.Item
            onSelect={() => onOpen(service)}
            className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm outline-none transition hover:bg-white/10"
          >
            <ChevronRight className="size-4" />
            Open
          </ContextMenu.Item>
          <ContextMenu.Item
            onSelect={() => onHelp(service)}
            className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm outline-none transition hover:bg-white/10"
          >
            <HelpCircle className="size-4" />
            Help
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}

function WeeklyCalendarColumn({ day, date, label, hours }: { day: string; date: string; label: string; hours: string[] }) {
  return (
    <div className="min-w-[94px] rounded-[20px] border border-white/8 bg-white/[0.04] p-2.5 backdrop-blur-xl">
      <div className="mb-2 rounded-[16px] bg-black/16 px-2.5 py-2 ring-1 ring-white/8">
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/42">{day}</div>
        <div className="mt-0.5 text-lg font-medium text-white">{date}</div>
        <div className="text-[10px] text-white/38">{label}</div>
      </div>
      <div className="space-y-1.5">
        {hours.map((hour) => (
          <div key={`${day}-${hour}`} className="rounded-2xl bg-black/16 px-2.5 py-1.5 text-xs text-white/72 ring-1 ring-white/8">
            {hour}
          </div>
        ))}
      </div>
    </div>
  )
}

function DailyCalendarView() {
  return (
    <div className="space-y-2.5">
      {dailySchedule.map((item) => (
        <div key={item.time} className="flex items-center justify-between rounded-[18px] bg-white/[0.04] px-3 py-2.5 ring-1 ring-white/8">
          <div className="text-xs font-medium text-cyan-100/80">{item.time}</div>
          <div className="text-xs text-white/62">{item.title}</div>
        </div>
      ))}
    </div>
  )
}

function TutorialOverlay({ open, setOpen }: { open: boolean; setOpen: (value: boolean) => void }) {
  const closeAndPersist = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(APP_CONFIG.tutorialStorageKey, "true")
    }
    setOpen(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#07101d]/72 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,760px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[30px] border border-white/10 bg-[#101827]/92 shadow-2xl backdrop-blur-2xl outline-none">
          <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
            <div>
              <Dialog.Title className="text-xl font-medium text-white">Welcome to {APP_CONFIG.landingTitle}</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-white/55">
                Landing page for Render deployment, with direct links to the live ticket system and GitBook spaces.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                onClick={closeAndPersist}
                className="flex size-9 items-center justify-center rounded-full bg-white/[0.06] text-white/70 ring-1 ring-white/8 transition hover:bg-white/[0.1]"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="grid gap-4 p-5 md:grid-cols-3">
            {[
              {
                title: "Open apps",
                text: "The Ticket System opens the real app route. Documentation and Manual Site open GitBook links.",
              },
              {
                title: "Help is ready",
                text: "Every right-click Help action points to a configurable GitBook URL so you can wire exact pages later.",
              },
              {
                title: "First-visit tutorial",
                text: "This tutorial is stored in localStorage and only appears automatically for first-time visitors.",
              },
            ].map((item, index) => (
              <div key={item.title} className="rounded-[24px] bg-white/[0.04] p-4 ring-1 ring-white/8">
                <div className="mb-3 flex size-8 items-center justify-center rounded-full bg-cyan-400/15 text-sm font-medium text-cyan-100 ring-1 ring-cyan-200/15">
                  {index + 1}
                </div>
                <div className="text-sm font-medium text-white">{item.title}</div>
                <p className="mt-2 text-sm leading-6 text-white/56">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-white/8 px-5 py-4">
            <div className="flex items-center gap-2 text-sm text-white/55">
              <Check className="size-4 text-emerald-300" />
              Ready for smooth Render + GitBook integration
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                onClick={closeAndPersist}
                className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-4 py-2 text-sm font-medium text-white ring-1 ring-white/10 transition hover:bg-white/[0.12]"
              >
                Enter hub
                <ArrowRight className="size-4" />
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default function AgiliteHubKiosk() {
  const [calendarView, setCalendarView] = React.useState<CalendarView>("weekly")
  const [tutorialOpen, setTutorialOpen] = React.useState(false)
  const [now, setNow] = React.useState(() => new Date())

  React.useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  React.useEffect(() => {
    if (typeof window === "undefined") return

    const tutorialSeen = window.localStorage.getItem(APP_CONFIG.tutorialStorageKey)
    setTutorialOpen(tutorialSeen !== "true")
  }, [])

  const formattedDate = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  const formattedTime = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })

  const handleOpenService = React.useCallback((service: ServiceDefinition) => {
    openUrl(service.appUrl, Boolean(service.openInNewTab))
  }, [])

  const handleHelpService = React.useCallback((service: ServiceDefinition) => {
    openUrl(service.helpUrl, true)
  }, [])

  const handleOpenHubHelp = React.useCallback(() => {
    openUrl(APP_CONFIG.helpFallbackUrl, true)
  }, [])

  const handleOpenHub = React.useCallback(() => {
    openUrl(APP_CONFIG.ticketSystemUrl, false)
  }, [])

  return (
    <Tooltip.Provider>
      <TutorialOverlay open={tutorialOpen} setOpen={setTutorialOpen} />

      <ContextMenu.Root>
        <ContextMenu.Trigger asChild>
          <div className="min-h-screen bg-[#0b1020] text-white">
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_26%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12),transparent_22%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.1),transparent_24%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:54px_54px] opacity-[0.06]" />

              <div className="relative mx-auto flex min-h-screen w-full max-w-[1650px] flex-col gap-4 p-4 lg:p-6">
                <header className="grid grid-cols-1 gap-4 xl:grid-cols-[1.25fr_0.95fr]">
                  <section className="rounded-[30px] border border-white/8 bg-white/[0.045] p-5 shadow-[0_22px_80px_-45px_rgba(0,0,0,0.9)] backdrop-blur-2xl lg:p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <LogoMark />
                          <div>
                            <div className="text-[10px] uppercase tracking-[0.34em] text-cyan-100/55">Agilite</div>
                            <h1 className="mt-0.5 text-[32px] font-medium tracking-tight md:text-[38px]">{APP_CONFIG.landingTitle}</h1>
                          </div>
                        </div>

                        <div className="max-w-2xl space-y-2.5">
                          <p className="text-sm leading-6 text-white/64 md:text-[15px]">
                            This is the landing page for the hosted project. It routes visitors into the live ticket system
                            and out to GitBook spaces for documentation and manuals.
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-white/54">
                            <div className="rounded-full bg-white/[0.05] px-3 py-1.5 ring-1 ring-white/8">Render Landing</div>
                            <div className="rounded-full bg-white/[0.05] px-3 py-1.5 ring-1 ring-white/8">Ticket System</div>
                            <div className="rounded-full bg-white/[0.05] px-3 py-1.5 ring-1 ring-white/8">GitBook Ready</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start justify-between gap-2 lg:flex-col lg:items-end">
                        <div className="flex items-center gap-2 rounded-full bg-black/18 px-3 py-2 ring-1 ring-white/8">
                          <Search className="size-3.5 text-white/42" />
                          <span className="text-xs text-white/50">Search services, docs, tools</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                              <button type="button" className="flex size-9 items-center justify-center rounded-full bg-white/[0.05] text-white/74 ring-1 ring-white/8 transition hover:bg-white/[0.1]">
                                <Settings className="size-4" />
                              </button>
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                              <Tooltip.Content sideOffset={8} className="rounded-xl border border-white/10 bg-[#121826] px-3 py-2 text-sm text-white shadow-xl">
                                Settings
                              </Tooltip.Content>
                            </Tooltip.Portal>
                          </Tooltip.Root>

                          <div className="flex items-center gap-2 rounded-full bg-white/[0.05] px-2 py-1.5 ring-1 ring-white/8">
                            <Avatar.Root className="inline-flex size-8 items-center justify-center overflow-hidden rounded-full bg-white/10 align-middle">
                              <Avatar.Fallback className="flex size-full items-center justify-center bg-cyan-500/18 text-[11px] font-medium text-cyan-100 delay-300">
                                AH
                              </Avatar.Fallback>
                            </Avatar.Root>
                            <div className="pr-1 text-xs font-medium text-white/84">{APP_CONFIG.userName}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-[30px] border border-white/8 bg-white/[0.045] p-4 shadow-[0_22px_80px_-45px_rgba(0,0,0,0.9)] backdrop-blur-2xl lg:p-5">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-white/56">
                          <CalendarDays className="size-3.5" />
                          Calendar
                        </div>
                        <h2 className="mt-1 text-xl font-medium tracking-tight">Working hours</h2>
                        <div className="mt-2 flex items-center gap-3 text-xs text-white/48">
                          <span>{formattedDate}</span>
                          <span>{formattedTime}</span>
                        </div>
                      </div>

                      <Tabs.Root value={calendarView} onValueChange={(value) => setCalendarView(value as CalendarView)} className="shrink-0">
                        <Tabs.List className="inline-flex rounded-full bg-black/20 p-1 ring-1 ring-white/8">
                          <Tabs.Trigger value="daily" className="rounded-full px-3 py-1.5 text-xs text-white/58 outline-none data-[state=active]:bg-white/[0.08] data-[state=active]:text-white">
                            Daily
                          </Tabs.Trigger>
                          <Tabs.Trigger value="weekly" className="rounded-full px-3 py-1.5 text-xs text-white/58 outline-none data-[state=active]:bg-white/[0.08] data-[state=active]:text-white">
                            Weekly
                          </Tabs.Trigger>
                        </Tabs.List>
                      </Tabs.Root>
                    </div>

                    <Tabs.Root value={calendarView} onValueChange={(value) => setCalendarView(value as CalendarView)}>
                      <Tabs.Content value="weekly">
                        <ScrollArea.Root className="w-full overflow-hidden rounded-[24px]">
                          <ScrollArea.Viewport className="w-full">
                            <div className="flex gap-2.5 pb-2">
                              {weeklySchedule.map((entry) => (
                                <WeeklyCalendarColumn
                                  key={entry.day}
                                  day={entry.day}
                                  date={entry.date}
                                  label={entry.label}
                                  hours={entry.hours}
                                />
                              ))}
                            </div>
                          </ScrollArea.Viewport>
                          <ScrollArea.Scrollbar orientation="horizontal" className="mt-1 flex h-2 touch-none select-none rounded-full bg-white/5 p-0.5 transition-colors">
                            <ScrollArea.Thumb className="relative flex-1 rounded-full bg-white/20" />
                          </ScrollArea.Scrollbar>
                        </ScrollArea.Root>
                      </Tabs.Content>

                      <Tabs.Content value="daily">
                        <div className="rounded-[24px] bg-black/12 p-2 ring-1 ring-white/8">
                          <DailyCalendarView />
                        </div>
                      </Tabs.Content>
                    </Tabs.Root>
                  </section>
                </header>

                <main className="grid grid-cols-1 gap-4 2xl:grid-cols-[1fr_280px]">
                  <section className="rounded-[30px] border border-white/8 bg-white/[0.04] p-4 shadow-[0_20px_70px_-42px_rgba(0,0,0,0.82)] backdrop-blur-2xl lg:p-5">
                    <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.26em] text-white/40">Applications</div>
                        <h2 className="mt-1.5 text-[24px] font-medium tracking-tight">Workspace services</h2>
                        <p className="mt-1.5 text-[11px] leading-5 text-white/54 md:text-xs">
                          Ticket System opens the live site. Documentation and Manual Site open GitBook directly.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-white/46">
                        <Clock3 className="size-3.5" />
                        Click to open, right click for Open and Help
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                      {services.map((service) => (
                        <ServiceCard
                          key={service.id}
                          service={service}
                          onOpen={handleOpenService}
                          onHelp={handleHelpService}
                          highlighted={service.id === "tickets"}
                        />
                      ))}
                    </div>
                  </section>

                  <aside className="space-y-4">
                    <section className="rounded-[28px] border border-white/8 bg-white/[0.045] p-4 shadow-[0_22px_80px_-45px_rgba(0,0,0,0.95)] backdrop-blur-2xl">
                      <div className="flex items-center gap-2 text-xs text-white/56">
                        <ShieldCheck className="size-3.5" />
                        Access panel
                      </div>
                      <h3 className="mt-1.5 text-lg font-medium tracking-tight">Account</h3>
                      <Separator.Root className="my-3 h-px bg-white/8" decorative />
                      <div className="space-y-2">
                        <button type="button" className="flex w-full items-center gap-2.5 rounded-[18px] bg-black/18 px-3 py-2.5 text-left text-sm text-white/76 ring-1 ring-white/8 transition hover:bg-white/[0.08]">
                          <User className="size-4" />
                          Profile
                        </button>
                        <button type="button" onClick={handleOpenHubHelp} className="flex w-full items-center gap-2.5 rounded-[18px] bg-black/18 px-3 py-2.5 text-left text-sm text-white/76 ring-1 ring-white/8 transition hover:bg-white/[0.08]">
                          <LifeBuoy className="size-4" />
                          Support help
                        </button>
                        <button type="button" className="flex w-full items-center gap-2.5 rounded-[18px] bg-black/18 px-3 py-2.5 text-left text-sm text-white/76 ring-1 ring-white/8 transition hover:bg-white/[0.08]">
                          <LogOut className="size-4" />
                          Sign out
                        </button>
                      </div>
                    </section>

                    <section className="rounded-[28px] border border-white/8 bg-white/[0.045] p-4 shadow-[0_22px_80px_-45px_rgba(0,0,0,0.95)] backdrop-blur-2xl">
                      <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">Integration notes</div>
                      <div className="mt-3 space-y-2">
                        <div className="rounded-[18px] bg-black/18 p-3 ring-1 ring-white/8">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Ticket className="size-4" />
                            Ticket System
                          </div>
                          <div className="mt-1 text-xs leading-5 text-white/52">Uses VITE_TICKET_SYSTEM_URL and opens in the same tab as the main app flow.</div>
                        </div>
                        <div className="rounded-[18px] bg-black/18 p-3 ring-1 ring-white/8">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <FileText className="size-4" />
                            Documentation
                          </div>
                          <div className="mt-1 text-xs leading-5 text-white/52">Uses VITE_GITBOOK_DOCS_URL and opens GitBook in a new tab.</div>
                        </div>
                        <div className="rounded-[18px] bg-black/18 p-3 ring-1 ring-white/8">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <BookOpen className="size-4" />
                            Manual Site
                          </div>
                          <div className="mt-1 text-xs leading-5 text-white/52">Uses VITE_GITBOOK_MANUALS_URL and right-click Help uses the configurable GitBook fallback.</div>
                        </div>
                      </div>
                    </section>
                  </aside>
                </main>
              </div>
            </div>
          </div>
        </ContextMenu.Trigger>

        <ContextMenu.Portal>
          <ContextMenu.Content className="z-50 min-w-[190px] overflow-hidden rounded-2xl border border-white/10 bg-[#131928]/92 p-1 text-white shadow-2xl backdrop-blur-xl">
            <ContextMenu.Item onSelect={handleOpenHub} className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm outline-none transition hover:bg-white/10">
              <ChevronRight className="size-4" />
              Open hub
            </ContextMenu.Item>
            <ContextMenu.Item onSelect={handleOpenHubHelp} className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm outline-none transition hover:bg-white/10">
              <HelpCircle className="size-4" />
              Help
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Portal>
      </ContextMenu.Root>

      <div className="pointer-events-none fixed bottom-4 right-4 hidden rounded-full border border-white/10 bg-[#111827]/65 px-3 py-1.5 text-[11px] text-white/55 shadow-xl backdrop-blur-xl lg:flex lg:items-center lg:gap-2">
        <ExternalLink className="size-3.5" />
        URLs are environment-driven for Render deployment
      </div>
    </Tooltip.Provider>
  )
}
