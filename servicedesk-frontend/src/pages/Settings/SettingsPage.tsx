import { useMemo, useState } from "react";
import { Moon, Sun, Palette, Check } from "lucide-react";
import AppLayot from "../../components/AppLayot";

const themes = [
  {
    id: "default",
    name: "Default",
    description: "Clean light theme for the regular support workspace.",
    icon: Sun,
    shell: "bg-slate-50 text-slate-900",
    card: "bg-white border-slate-200 text-slate-900",
    preview: "bg-gradient-to-br from-white via-slate-50 to-slate-100",
    chip: "bg-slate-900 text-white",
    optionCard:
      "bg-white border-slate-300 text-slate-900 hover:border-slate-400 hover:shadow-sm",
    optionCardActive: "bg-white border-slate-900 text-slate-900 shadow-sm",
    previewFrame: "border-slate-200",
    previewBox: "border-slate-200 bg-white/70",
    previewBox2: "border-slate-200 bg-white/50",
    previewBox3: "border-slate-200 bg-white/30",
    iconWrap: "bg-black/10 text-slate-700",
    toggleRow: "border-black/10 bg-black/5",
    infoBox: "border-slate-300",
  },
  {
    id: "dark",
    name: "Dark",
    description: "Low-glare mode for long support shifts and night work.",
    icon: Moon,
    shell: "bg-slate-950 text-slate-100",
    card: "bg-slate-900 border-slate-800 text-slate-100",
    preview: "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800",
    chip: "bg-white text-slate-900",
    optionCard:
      "bg-slate-950 border-slate-700 text-slate-100 hover:border-slate-500 hover:shadow-sm",
    optionCardActive: "bg-slate-950 border-white text-slate-100 shadow-sm",
    previewFrame: "border-slate-700",
    previewBox: "border-slate-400 bg-slate-300/70",
    previewBox2: "border-slate-500 bg-slate-400/50",
    previewBox3: "border-slate-500 bg-slate-500/30",
    iconWrap: "bg-white/10 text-slate-100",
    toggleRow: "border-slate-800 bg-slate-950",
    infoBox: "border-slate-700",
  },
  {
    id: "khaki-camo",
    name: "Khaki Camo",
    description: "A muted field-style theme with a khaki camouflage pattern.",
    icon: Palette,
    shell: "text-stone-900",
    card: "border-[#8b8a63] bg-[#d6d0a7] text-stone-900",
    preview: "bg-[#c8c08f]",
    chip: "bg-[#5f6740] text-white",
    optionCard:
      "bg-[#e3ddb8] border-[#8b8a63] text-stone-900 hover:border-[#6f7751] hover:shadow-sm",
    optionCardActive: "bg-[#f0ebc9] border-[#5f6740] text-stone-900 shadow-sm",
    previewFrame: "border-[#8b8a63]",
    previewBox: "border-black/10 bg-[#f4f0d8]",
    previewBox2: "border-black/10 bg-[#d8d0a6]",
    previewBox3: "border-black/10 bg-[#a29b68]",
    iconWrap: "bg-black/10 text-stone-800",
    toggleRow: "border-black/10 bg-[#cfc79b]",
    infoBox: "border-[#8b8a63]",
  },
] as const;

type ThemeId = (typeof themes)[number]["id"];

function CamoPreview() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-[#8b8a63] bg-[#c8c08f]">
      <div className="absolute inset-0 opacity-90">
        <div className="absolute left-[8%] top-[14%] h-16 w-24 rounded-full bg-[#8b8a63]/70" />
        <div className="absolute left-[28%] top-[42%] h-24 w-32 rounded-full bg-[#6f7751]/60" />
        <div className="absolute right-[12%] top-[18%] h-20 w-28 rounded-full bg-[#b4ab77]/80" />
        <div className="absolute bottom-[12%] left-[18%] h-20 w-28 rounded-full bg-[#9d9465]/70" />
        <div className="absolute bottom-[20%] right-[14%] h-24 w-36 rounded-full bg-[#5f6740]/55" />
      </div>

      <div className="absolute inset-x-4 top-4 rounded-xl border border-black/10 bg-[#ebe6c7] px-3 py-2">
        <div className="text-xs font-semibold text-stone-700">
          Theme preview
        </div>
        <div className="mt-1 h-2 w-24 rounded-full bg-[#6f7751]/60" />
      </div>

      <div className="absolute inset-x-4 bottom-4 grid grid-cols-3 gap-2">
        <div className="h-10 rounded-xl border border-slate-300 bg-white" />
        <div className="h-10 rounded-xl border border-slate-300 bg-slate-50" />
        <div className="h-10 rounded-xl border border-slate-300 bg-slate-100" />
      </div>
    </div>
  );
}

type ToggleRowProps = {
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  rowClassName: string;
  textClassName: string;
};

function ToggleRow({
  title,
  description,
  checked,
  onChange,
  rowClassName,
  textClassName,
}: ToggleRowProps) {
  return (
    <div
      className={`flex items-start justify-between gap-4 rounded-2xl border p-4 ${rowClassName}`}
    >
      <div className={textClassName}>
        <div className="font-medium">{title}</div>
        <div className="mt-1 text-sm opacity-70">{description}</div>
      </div>

      <button
        type="button"
        onClick={onChange}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? "bg-slate-900" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>("default");
  const [compactSidebar, setCompactSidebar] = useState(false);
  const [desktopNotifications, setDesktopNotifications] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(false);

  const activeTheme = useMemo(
    () => themes.find((theme) => theme.id === selectedTheme) ?? themes[0],
    [selectedTheme],
  );

  return (
    <AppLayot
      title="Settings"
      subtitle="Workspace personalization and support preferences."
      action={
        <div
          className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium ${activeTheme.chip}`}
        >
          <Check className="h-4 w-4" />
          Active theme: {activeTheme.name}
        </div>
      }
    >
      <div
        className={`space-y-6 rounded-[28px] p-1 transition-colors duration-300 ${
          activeTheme.id === "khaki-camo" ? "bg-[#b8b17c]" : activeTheme.shell
        }`}
      >
        <section className={`rounded-[28px] border p-6 ${activeTheme.card}`}>
          <div>
            <div className="text-sm font-medium opacity-70">
              Workspace preferences
            </div>
            <p className="mt-2 max-w-2xl text-sm opacity-75">
              Control the visual style of the ticket system. For now, this page
              enables three appearance modes only: Default, Dark, and Khaki
              Camo.
            </p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <div className={`rounded-[28px] border p-6 ${activeTheme.card}`}>
            <div className="mb-5">
              <h2 className="text-xl font-semibold">Appearance</h2>
              <p className="mt-1 text-sm opacity-70">
                Choose the theme used across dashboard, tickets, and profile
                pages.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {themes.map((theme) => {
                const Icon = theme.icon;
                const isActive = selectedTheme === theme.id;
                const optionCardClass = isActive
                  ? theme.optionCardActive
                  : theme.optionCard;

                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`appearance-none overflow-hidden rounded-[24px] p-4 text-left outline-none transition duration-150 ease-out hover:-translate-y-0.5 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                      theme.id === "dark"
                        ? isActive
                          ? "border-2 border-white bg-slate-950 text-slate-100"
                          : "border border-slate-700 bg-slate-950 text-slate-100 hover:border-slate-500"
                        : theme.id === "khaki-camo"
                          ? isActive
                            ? "border-2 border-[#5f6740] bg-[#f0ebc9] text-stone-900"
                            : "border border-[#8b8a63] bg-[#e3ddb8] text-stone-900 hover:border-[#6f7751]"
                          : isActive
                            ? "border-2 border-slate-700 bg-white text-slate-900"
                            : "border border-slate-300 bg-white text-slate-900 hover:border-slate-500"
                    }`}
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-2xl ${theme.iconWrap}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      {isActive && (
                        <div className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">
                          Enabled
                        </div>
                      )}
                    </div>

                    <div className="mb-3">
                      <div className="font-semibold">{theme.name}</div>
                      <div className="mt-1 text-sm opacity-70">
                        {theme.description}
                      </div>
                    </div>

                    <div className="h-32 overflow-hidden rounded-2xl">
                      {theme.id === "khaki-camo" ? (
                        <CamoPreview />
                      ) : (
                        <div
                          className={`flex h-full items-end rounded-2xl border border-slate-300 p-3 ${theme.preview} ${theme.previewFrame}`}
                        >
                          <div className="grid w-full grid-cols-3 gap-2">
                            <div
                              className={`h-10 rounded-xl border ${theme.previewBox}`}
                            />
                            <div
                              className={`h-10 rounded-xl border ${theme.previewBox2}`}
                            />
                            <div
                              className={`h-10 rounded-xl border ${theme.previewBox3}`}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={`rounded-[28px] border p-6 ${activeTheme.card}`}>
            <h2 className="text-xl font-semibold">Quick preferences</h2>
            <p className="mt-1 text-sm opacity-70">
              Extra toggles to make the page feel complete while keeping scope
              small.
            </p>

            <div className="mt-6 space-y-4">
              <ToggleRow
                title="Compact sidebar"
                description="Shrink the left navigation to icon mode."
                checked={compactSidebar}
                onChange={() => setCompactSidebar((value) => !value)}
                rowClassName={activeTheme.toggleRow}
                textClassName={
                  activeTheme.id === "dark" ? "text-slate-100" : ""
                }
              />
              <ToggleRow
                title="Desktop notifications"
                description="Show browser notifications for new ticket replies."
                checked={desktopNotifications}
                onChange={() => setDesktopNotifications((value) => !value)}
                rowClassName={activeTheme.toggleRow}
                textClassName={
                  activeTheme.id === "dark" ? "text-slate-100" : ""
                }
              />
              <ToggleRow
                title="Sound alerts"
                description="Play a short sound when critical tickets are updated."
                checked={soundAlerts}
                onChange={() => setSoundAlerts((value) => !value)}
                rowClassName={activeTheme.toggleRow}
                textClassName={
                  activeTheme.id === "dark" ? "text-slate-100" : ""
                }
              />
            </div>

            <div
              className={`mt-6 rounded-2xl border border-dashed p-4 text-sm opacity-80 ${activeTheme.infoBox}`}
            >
              Current enabled themes:{" "}
              <span className="font-semibold">Default, Dark, Khaki Camo</span>
            </div>
          </div>
        </section>
      </div>
    </AppLayot>
  );
}
