import * as React from "react"
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  ExternalLink,
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
import * as Tooltip from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"
import { Badge } from "@/ui/badge"
import { Button } from "@/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type ServiceId = "tickets" | "manuals"
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
  ticketSystemUrl: import.meta.env.VITE_TICKET_SYSTEM_URL ?? "/dashboard",
  manualSiteUrl: "https://nadav-1.gitbook.io/agilite",
  ticketSystemHelpUrl:
    "https://nadav-1.gitbook.io/agilite/documentation/ticket-system/system-overview",
  helpFallbackUrl:
    "https://nadav-1.gitbook.io/agilite/documentation",
  userName: import.meta.env.VITE_HUB_USER_NAME ?? "Nadav Hadar",
  tutorialStorageKey: "agilite-hub-tutorial-seen",
} as const

const weeklySchedule = [
  {
    day: "Sun",
    date: "14",
    label: "Mar 14",
    hours: ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00"],
  },
  {
    day: "Mon",
    date: "15",
    label: "Mar 15",
    hours: ["08:00", "09:30", "11:00", "12:30", "14:00", "15:30"],
  },
  {
    day: "Tue",
    date: "16",
    label: "Mar 16",
    hours: ["08:00", "09:00", "10:00", "13:00", "15:00", "16:00"],
  },
  {
    day: "Wed",
    date: "17",
    label: "Mar 17",
    hours: ["08:30", "10:00", "11:30", "13:00", "14:30", "16:00"],
  },
  {
    day: "Thu",
    date: "18",
    label: "Mar 18",
    hours: ["08:00", "09:00", "10:30", "12:00", "14:00", "15:00"],
  },
  {
    day: "Fri",
    date: "19",
    label: "Mar 19",
    hours: ["08:00", "09:00", "10:00", "11:00", "12:00"],
  },
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
    accent: "from-cyan-400/26 via-sky-400/14 to-transparent",
    badge: "Core",
    appUrl: APP_CONFIG.ticketSystemUrl,
    helpUrl: APP_CONFIG.ticketSystemHelpUrl,
  },
  {
    id: "manuals",
    name: "Manual Site",
    subtitle: "Agilite Knowledge Platform",
    icon: BookOpen,
    accent: "from-emerald-400/26 via-teal-400/14 to-transparent",
    badge: "Guide",
    appUrl: APP_CONFIG.manualSiteUrl,
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

function glassSurface(className?: string) {
  return cn(
    "overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.05] py-0 text-white ring-white/10 shadow-[0_20px_60px_-38px_rgba(2,6,23,0.82)] backdrop-blur-xl",
    className,
  )
}

function pillClass(className?: string) {
  return cn(
    "rounded-full border border-white/10 bg-white/[0.075] px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-white/72 shadow-none backdrop-blur-md",
    className,
  )
}

function actionButtonClass(className?: string) {
  return cn(
    "rounded-full border border-white/12 bg-white/[0.075] text-white shadow-none backdrop-blur-md hover:bg-white/[0.12] hover:text-white",
    className,
  )
}

function LogoMark() {
  return (
    <div className="relative flex h-10 w-10 items-center justify-center rounded-[14px] border border-white/10 bg-white/[0.08] shadow-[0_12px_28px_-20px_rgba(34,211,238,0.55)] backdrop-blur-md">
      <div className="absolute inset-[6px] rounded-[10px] bg-gradient-to-br from-cyan-300/95 via-sky-400/80 to-violet-400/90" />
      <div className="relative flex items-center gap-[3px]">
        <span className="h-3.5 w-1.5 rounded-full bg-white/95" />
        <span className="h-5.5 w-1.5 rounded-full bg-white/95" />
        <span className="h-2.5 w-1.5 rounded-full bg-white/95" />
      </div>
    </div>
  )
}

function GlassPanel({
  className,
  ...props
}: React.ComponentProps<typeof Card>) {
  return <Card className={glassSurface(className)} {...props} />
}

function ServiceCard({
  service,
  highlighted = false,
  onOpen,
  onHelp,
}: ServiceCardProps) {
  const Icon = service.icon

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <button
          type="button"
          onClick={() => onOpen(service)}
          className={cn(
            "group relative flex aspect-square min-h-[112px] w-full flex-col justify-between overflow-hidden rounded-[24px] border p-3.5 text-left text-white shadow-[0_14px_38px_-26px_rgba(2,6,23,0.88)] backdrop-blur-xl transition duration-200",
            "bg-white/[0.06] hover:-translate-y-0.5 hover:bg-white/[0.08]",
            highlighted
              ? "border-cyan-200/28 bg-white/[0.09] shadow-[0_18px_44px_-24px_rgba(56,189,248,0.36)]"
              : "border-white/10",
          )}
        >
          <div
            className={cn(
              "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-90",
              service.accent,
            )}
          />
          <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-white/20" />
          <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.02))]" />

          {highlighted ? (
            <div className="pointer-events-none absolute inset-0 rounded-[24px] ring-1 ring-cyan-200/20" />
          ) : null}

          <div className="relative flex items-start justify-between gap-2">
            <div className="flex size-9 items-center justify-center rounded-[14px] border border-white/10 bg-white/[0.08] shadow-inner shadow-white/10 backdrop-blur-md">
              <Icon className="size-[18px] text-white/92" />
            </div>

            <Badge
              className={pillClass(
                cn(
                  "px-2 py-0.5 text-[9px] tracking-[0.2em]",
                  highlighted ? "text-cyan-50" : "text-white/60",
                ),
              )}
            >
              {service.badge}
            </Badge>
          </div>

          <div className="relative space-y-0.5">
            <div className="flex items-center gap-1.5 text-[15px] font-medium tracking-tight text-white">
              <span>{service.name}</span>
              {highlighted ? (
                <ArrowRight className="size-3.5 text-cyan-100/90" />
              ) : null}
            </div>
            <div className="max-w-[12rem] text-[11px] leading-[18px] text-white/58">
              {service.subtitle}
            </div>
          </div>
        </button>
      </ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Content className="z-50 min-w-[180px] overflow-hidden rounded-2xl border border-white/10 bg-[#11192a]/82 p-1 text-white shadow-2xl backdrop-blur-xl">
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

function WeeklyCalendarColumn({
  day,
  date,
  label,
  hours,
}: {
  day: string
  date: string
  label: string
  hours: string[]
}) {
  return (
    <GlassPanel
      size="sm"
      className="min-w-[96px] rounded-[20px] bg-white/[0.045] shadow-[0_12px_36px_-28px_rgba(15,23,42,0.78)]"
    >
      <CardContent className="p-2.5">
        <div className="mb-2 rounded-[16px] border border-white/8 bg-black/18 px-2.5 py-2">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/42">
            {day}
          </div>
          <div className="mt-0.5 text-lg font-medium text-white">{date}</div>
          <div className="text-[10px] text-white/38">{label}</div>
        </div>
        <div className="space-y-1.5">
          {hours.map((hour) => (
            <div
              key={`${day}-${hour}`}
              className="rounded-2xl border border-white/8 bg-black/18 px-2.5 py-1.5 text-xs text-white/72"
            >
              {hour}
            </div>
          ))}
        </div>
      </CardContent>
    </GlassPanel>
  )
}

function DailyCalendarView() {
  return (
    <div className="space-y-2.5">
      {dailySchedule.map((item) => (
        <div
          key={item.time}
          className="flex items-center justify-between rounded-[18px] border border-white/8 bg-white/[0.045] px-3 py-2.5 backdrop-blur-md"
        >
          <div className="text-xs font-medium text-cyan-100/80">{item.time}</div>
          <div className="text-xs text-white/62">{item.title}</div>
        </div>
      ))}
    </div>
  )
}

function TutorialOverlay({
  open,
  setOpen,
}: {
  open: boolean
  setOpen: (value: boolean) => void
}) {
  const closeAndPersist = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(APP_CONFIG.tutorialStorageKey, "true")
    }
    setOpen(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#07101d]/68 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,760px)] -translate-x-1/2 -translate-y-1/2 outline-none">
          <GlassPanel className="bg-[#101827]/88">
            <CardHeader className="border-b border-white/8 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Dialog.Title asChild>
                    <CardTitle className="text-xl text-white">
                      Welcome to {APP_CONFIG.landingTitle}
                    </CardTitle>
                  </Dialog.Title>
                  <Dialog.Description asChild>
                    <CardDescription className="mt-1 max-w-2xl text-sm leading-6 text-white/55">
                      Landing page for Render deployment, with direct links to the
                      live ticket system and the Agilite Knowledge Platform.
                    </CardDescription>
                  </Dialog.Description>
                </div>

                <button
                  type="button"
                  onClick={closeAndPersist}
                  className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/[0.1]"
                >
                  <X className="size-4" />
                </button>
              </div>
            </CardHeader>

            <CardContent className="grid gap-4 p-5 md:grid-cols-3">
              {[
                {
                  title: "Open apps",
                  text: "The Ticket System opens the real app route. Manual Site opens the Agilite Knowledge Platform in GitBook.",
                },
                {
                  title: "Help is ready",
                  text: "Ticket System Help opens the system overview page, and Manual Site Help opens the documentation root.",
                },
                {
                  title: "First-visit tutorial",
                  text: "This tutorial is stored in localStorage and only appears automatically for first-time visitors.",
                },
              ].map((item, index) => (
                <GlassPanel
                  key={item.title}
                  size="sm"
                  className="rounded-[24px] bg-white/[0.045] shadow-none"
                >
                  <CardContent className="p-4">
                    <div className="mb-3 flex size-8 items-center justify-center rounded-full border border-cyan-200/14 bg-cyan-400/15 text-sm font-medium text-cyan-100">
                      {index + 1}
                    </div>
                    <div className="text-sm font-medium text-white">
                      {item.title}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-white/56">
                      {item.text}
                    </p>
                  </CardContent>
                </GlassPanel>
              ))}
            </CardContent>

            <CardFooter className="justify-between border-white/8 bg-black/12 px-5 py-4">
              <div className="flex items-center gap-2 text-sm text-white/55">
                <Check className="size-4 text-emerald-300" />
                Ready for smooth Render + GitBook navigation
              </div>

              <Button
                type="button"
                onClick={closeAndPersist}
                className={actionButtonClass("px-4")}
              >
                Enter hub
                <ArrowRight className="size-4" />
              </Button>
            </CardFooter>
          </GlassPanel>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default function AgiliteHubKiosk() {
  const [calendarView, setCalendarView] =
    React.useState<CalendarView>("weekly")
  const [tutorialOpen, setTutorialOpen] = React.useState(false)
  const [now, setNow] = React.useState(() => new Date())

  React.useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  React.useEffect(() => {
    if (typeof window === "undefined") return

    const tutorialSeen = window.localStorage.getItem(
      APP_CONFIG.tutorialStorageKey,
    )
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
      <div className="min-h-screen bg-[#08101c] text-white">
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.14),transparent_26%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12),transparent_20%),radial-gradient(circle_at_bottom,rgba(20,184,166,0.08),transparent_22%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:56px_56px] opacity-[0.035]" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_20%,rgba(8,16,28,0.12)_100%)]" />

              <div className="relative mx-auto flex min-h-screen w-full max-w-[1650px] flex-col gap-4 p-4 lg:p-6">
                <header className="grid grid-cols-1 gap-4 xl:grid-cols-[1.25fr_0.95fr]">
                  <GlassPanel>
                    <CardContent className="p-5 lg:p-6">
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <button
                          type="button"
                          onClick={handleOpenHub}
                          className="space-y-4 text-left"
                        >
                          <div className="flex items-center gap-3">
                            <LogoMark />
                            <div>
                              <div className="text-[10px] uppercase tracking-[0.34em] text-cyan-100/55">
                                Agilite
                              </div>
                              <h1 className="mt-0.5 text-[32px] font-medium tracking-tight md:text-[38px]">
                                {APP_CONFIG.landingTitle}
                              </h1>
                            </div>
                          </div>

                          <div className="max-w-2xl space-y-2.5">
                            <p className="text-sm leading-6 text-white/64 md:text-[15px]">
                              This is the landing page for the hosted project. It routes visitors into the live ticket system
                              and out to the Agilite Knowledge Platform manual site.
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-white/54">
                              <Badge className={pillClass()}>Render Landing</Badge>
                              <Badge className={pillClass()}>Ticket System</Badge>
                              <Badge className={pillClass()}>GitBook Ready</Badge>
                            </div>
                          </div>
                        </button>

                        <div className="flex items-start justify-between gap-2 lg:flex-col lg:items-end">
                          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/18 px-3 py-2 backdrop-blur-md">
                            <Search className="size-3.5 text-white/42" />
                            <span className="text-xs text-white/50">
                              Search services, manuals, tools
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Tooltip.Root>
                              <Tooltip.Trigger asChild>
                                <button
                                  type="button"
                                  className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/74 transition hover:bg-white/[0.1]"
                                >
                                  <Settings className="size-4" />
                                </button>
                              </Tooltip.Trigger>
                              <Tooltip.Portal>
                                <Tooltip.Content
                                  sideOffset={8}
                                  className="rounded-xl border border-white/10 bg-[#121826]/90 px-3 py-2 text-sm text-white shadow-xl backdrop-blur-md"
                                >
                                  Settings
                                </Tooltip.Content>
                              </Tooltip.Portal>
                            </Tooltip.Root>

                            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-2 py-1.5 backdrop-blur-md">
                              <Avatar.Root className="inline-flex size-8 items-center justify-center overflow-hidden rounded-full bg-white/10 align-middle">
                                <Avatar.Fallback className="flex size-full items-center justify-center bg-cyan-500/18 text-[11px] font-medium text-cyan-100 delay-300">
                                  AH
                                </Avatar.Fallback>
                              </Avatar.Root>
                              <div className="pr-1 text-xs font-medium text-white/84">
                                {APP_CONFIG.userName}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </GlassPanel>

                  <GlassPanel>
                    <CardContent className="p-4 lg:p-5">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 text-xs text-white/56">
                            <CalendarDays className="size-3.5" />
                            Calendar
                          </div>
                          <h2 className="mt-1 text-xl font-medium tracking-tight">
                            Working hours
                          </h2>
                          <div className="mt-2 flex items-center gap-3 text-xs text-white/48">
                            <span>{formattedDate}</span>
                            <span>{formattedTime}</span>
                          </div>
                        </div>

                        <Tabs
                          value={calendarView}
                          onValueChange={(value) =>
                            setCalendarView(value as CalendarView)
                          }
                          className="shrink-0"
                        >
                          <TabsList className="rounded-full border border-white/10 bg-black/18 p-1">
                            <TabsTrigger
                              value="daily"
                              className="rounded-full px-3 py-1.5 text-xs text-white/58 data-[state=active]:bg-white/[0.08] data-[state=active]:text-white"
                            >
                              Daily
                            </TabsTrigger>
                            <TabsTrigger
                              value="weekly"
                              className="rounded-full px-3 py-1.5 text-xs text-white/58 data-[state=active]:bg-white/[0.08] data-[state=active]:text-white"
                            >
                              Weekly
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>

                      <Tabs
                        value={calendarView}
                        onValueChange={(value) =>
                          setCalendarView(value as CalendarView)
                        }
                      >
                        <TabsContent value="weekly">
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
                            <ScrollArea.Scrollbar
                              orientation="horizontal"
                              className="mt-1 flex h-2 touch-none select-none rounded-full bg-white/5 p-0.5 transition-colors"
                            >
                              <ScrollArea.Thumb className="relative flex-1 rounded-full bg-white/20" />
                            </ScrollArea.Scrollbar>
                          </ScrollArea.Root>
                        </TabsContent>

                        <TabsContent value="daily">
                          <div className="rounded-[24px] border border-white/8 bg-black/14 p-2">
                            <DailyCalendarView />
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </GlassPanel>
                </header>

                <main className="grid grid-cols-1 gap-4 2xl:grid-cols-[1fr_280px]">
                  <GlassPanel>
                    <CardContent className="p-4 lg:p-5">
                      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.26em] text-white/40">
                            Applications
                          </div>
                          <h2 className="mt-1.5 text-[24px] font-medium tracking-tight">
                            Workspace services
                          </h2>
                          <p className="mt-1.5 text-[11px] leading-5 text-white/54 md:text-xs">
                            Ticket System opens the live site. Manual Site opens the Agilite Knowledge Platform.
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
                    </CardContent>
                  </GlassPanel>

                  <aside className="space-y-4">
                    <GlassPanel className="rounded-[28px]">
                      <CardHeader className="px-4 pb-0 pt-4">
                        <div className="flex items-center gap-2 text-xs text-white/56">
                          <ShieldCheck className="size-3.5" />
                          Access panel
                        </div>
                        <CardTitle className="mt-1.5 text-lg font-medium tracking-tight text-white">
                          Account
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 p-4">
                        <div className="h-px bg-white/8" />
                        <div className="space-y-2">
                          <Button
                            type="button"
                            className={actionButtonClass(
                              "w-full justify-start rounded-[18px] bg-black/18 px-3 py-2.5 text-left text-sm text-white/76",
                            )}
                          >
                            <User className="size-4" />
                            Profile
                          </Button>
                          <Button
                            type="button"
                            onClick={handleOpenHubHelp}
                            className={actionButtonClass(
                              "w-full justify-start rounded-[18px] bg-black/18 px-3 py-2.5 text-left text-sm text-white/76",
                            )}
                          >
                            <LifeBuoy className="size-4" />
                            Support help
                          </Button>
                          <Button
                            type="button"
                            className={actionButtonClass(
                              "w-full justify-start rounded-[18px] bg-black/18 px-3 py-2.5 text-left text-sm text-white/76",
                            )}
                          >
                            <LogOut className="size-4" />
                            Sign out
                          </Button>
                        </div>
                      </CardContent>
                    </GlassPanel>

                    <GlassPanel className="rounded-[28px]">
                      <CardHeader className="px-4 pb-0 pt-4">
                        <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">
                          Integration notes
                        </div>
                      </CardHeader>
                      <CardContent className="mt-3 space-y-2 p-4 pt-0">
                        <GlassPanel
                          size="sm"
                          className="rounded-[18px] bg-black/18 shadow-none"
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-white">
                              <Ticket className="size-4" />
                              Ticket System
                            </div>
                            <div className="mt-1 text-xs leading-5 text-white/52">
                              Uses VITE_TICKET_SYSTEM_URL and opens in the same tab as the main app flow.
                            </div>
                          </CardContent>
                        </GlassPanel>
                        <GlassPanel
                          size="sm"
                          className="rounded-[18px] bg-black/18 shadow-none"
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-white">
                              <BookOpen className="size-4" />
                              Manual Site
                            </div>
                            <div className="mt-1 text-xs leading-5 text-white/52">
                              Opens the Agilite Knowledge Platform in a new tab, and Help goes to the documentation root.
                            </div>
                          </CardContent>
                        </GlassPanel>
                      </CardContent>
                    </GlassPanel>
                  </aside>
                </main>
              </div>
            </div>
      </div>

      <div className="pointer-events-none fixed bottom-4 right-4 hidden rounded-full border border-white/10 bg-[#111827]/58 px-3 py-1.5 text-[11px] text-white/55 shadow-xl backdrop-blur-xl lg:flex lg:items-center lg:gap-2">
        <ExternalLink className="size-3.5" />
        Ticket System stays local, manuals and help open GitBook
      </div>
    </Tooltip.Provider>
  )
}
