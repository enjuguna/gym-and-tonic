import { useEffect, useMemo, useRef, useState } from "react";
import { usePlan, DAYS } from "../lib/store";
import type { Slot } from "../lib/store";
import { registerAllTools } from "../lib/webmcp";
import { balanceCheck, gearList } from "../lib/coach";
import { SceneImage } from "./ui/SceneImage";
import { DayStory } from "./ui/DayStory";
import { CoachVoice } from "./ui/CoachVoice";
import { GHOST_COPY_KENYA, greetingEat, REFUEL_SPOTLIGHTS } from "../lib/kenyanFlavor";

const FOCUS_META: Record<string, { icon: string; chip: string }> = {
  legs: { icon: "🦵", chip: "bg-orange-100 text-orange-800" },
  push: { icon: "💪", chip: "bg-sky-100 text-sky-800" },
  pull: { icon: "🪢", chip: "bg-violet-100 text-violet-800" },
  core: { icon: "🎯", chip: "bg-lime-100 text-lime-800" },
  cardio: { icon: "❤️", chip: "bg-rose-100 text-rose-800" },
  mobility: { icon: "🧘", chip: "bg-teal-100 text-teal-800" },
};

const GROUPS = ["legs", "push", "pull", "core", "cardio", "mobility"] as const;

function phase(count: number): string {
  if (count < 7) return "A fresh little start";
  if (count < 13) return "Momentum week — kama simba.";
  return "Finisher mode";
}

export default function Planner() {
  const plan = usePlan((s) => s.plan);
  const proposals = usePlan((s) => s.proposals);
  const approve = usePlan((s) => s.approveProposal);
  const undo = usePlan((s) => s.undoProposal);
  const placeSession = usePlan((s) => s.placeSession);
  const clearSlot = usePlan((s) => s.clearSlot);
  const [mcpStatus, setMcpStatus] = useState<{ supported: boolean; registered: number } | null>(null);
  const [slotMenu, setSlotMenu] = useState<Slot | null>(null);
  const [storySlot, setStorySlot] = useState<Slot | null>(null);
  const stampedRef = useRef(false);

  useEffect(() => {
    registerAllTools().then(setMcpStatus).catch(console.error);
  }, []);

  const pending = proposals.filter((p) => p.state === "pending");
  const sessions = useMemo(() => Object.values(plan), [plan]);
  const balance = useMemo(() => balanceCheck(sessions), [sessions]);
  const gear = useMemo(() => Object.entries(gearList(sessions)), [sessions]);
  const plannedCount = sessions.length;
  const complete = plannedCount === 14;

  useEffect(() => {
    if (complete && !stampedRef.current) {
      stampedRef.current = true;
      import("../lib/sound").then(({ sound }) => sound.sting(true));
    }
    if (!complete) stampedRef.current = false;
  }, [complete]);

  const storySession = storySlot ? plan[storySlot] : null;
  const greeting = useMemo(() => greetingEat(new Date().getUTCHours() + 3), []);
  const coveredGroups = useMemo(() => new Set(sessions.map((s) => s.focus)), [sessions]);
  const spotlight = useMemo(() => REFUEL_SPOTLIGHTS[plannedCount % REFUEL_SPOTLIGHTS.length], [plannedCount]);

  return (
    <div className="grain min-h-screen bg-[#f7f5ef] text-[#26251f]">
      {/* header */}
      <header className="sticky top-0 z-30 border-b border-[#e6e1d4] bg-[#f7f5ef]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-x-5 px-5 py-3">
          <h1 className="font-serif text-lg font-semibold tracking-tight">
            gym<span className="text-emerald-700">&amp;</span>tonic
          </h1>
          <span className="hidden text-sm italic text-stone-400 sm:inline">a little less “should I train today?”</span>
          <div className="ml-auto flex items-center gap-2">
            {mcpStatus && (
              <span
                title={
                  mcpStatus.supported
                    ? "Your AI coach can plan sessions through this page's site tools."
                    : "Open in Chrome with WebMCP or the ChatGPT desktop app to bring your coach."
                }
                className={`inline-flex cursor-help items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                  mcpStatus.supported
                    ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-600/20"
                    : "bg-stone-200/60 text-stone-600 ring-1 ring-stone-400/20"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${mcpStatus.supported ? "animate-pulse bg-emerald-600" : "bg-stone-500"}`} />
                {mcpStatus.supported ? `Coach connected · ${mcpStatus.registered} tools` : "Solo — no coach connected"}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-5 pb-24 pt-8">
        {/* hero */}
        <section className="animate-rise relative mb-8 overflow-hidden rounded-3xl shadow-lg">
          <SceneImage scene="hero-week" kenburns className="h-64 sm:h-72">
            <div className="flex h-full flex-col justify-end bg-gradient-to-t from-black/70 via-black/25 to-black/40 p-7 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] drop-shadow-md">
                <span className="rounded bg-black/35 px-2 py-0.5 backdrop-blur-sm">{phase(plannedCount)}</span>
              </p>
              <h2 className="mt-2 font-serif text-4xl font-semibold tracking-tight drop-shadow-lg sm:text-5xl">
                {greeting.hello} Your week, well trained.
              </h2>
              <p className="mt-2 max-w-md text-sm opacity-90">
                {greeting.hint}{" "}
                {14 - plannedCount > 0
                  ? `${14 - plannedCount} chances to move something this week.`
                  : "A full week on the board. Show-off."}
              </p>
            </div>
          </SceneImage>
          {complete && (
            <div
              className="animate-[stamp-in_0.5s_cubic-bezier(0.22,1,0.36,1)_both] absolute right-8 top-8 rounded-lg border-4 border-emerald-600 bg-white/90 px-5 py-2 font-serif text-xl font-bold uppercase tracking-widest text-emerald-700 shadow-xl"
            >
              Week complete · well trained.
            </div>
          )}
        </section>

        {/* progress + coverage + verdict */}
        <div className="-mt-4 mb-6 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-[#e6e1d4] bg-white px-5 py-4 shadow-md">
          <ProgressRing done={plannedCount} total={14} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{plannedCount} of 14 sessions planned</p>
            <p className="text-xs text-stone-400">
              {balance.totalMinutes} minutes ·{" "}
              {balance.neglected.length === 0 ? balance.verdict : `skipped: ${balance.neglected.join(", ")}`}
            </p>
            {/* muscle-group coverage strip */}
            <div className="mt-2 flex gap-1.5" title="Muscle groups covered this week">
              {GROUPS.map((g) => {
                const covered = coveredGroups.has(g);
                return (
                  <span
                    key={g}
                    className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-all ${
                      covered ? `${FOCUS_META[g].chip}` : "bg-stone-100 text-stone-300 line-through"
                    }`}
                  >
                    {FOCUS_META[g].icon} {g}
                  </span>
                );
              })}
            </div>
          </div>
          {/* streak flame */}
          <div className="flex flex-col items-center" title="Sessions planned this week">
            <span
              className={`transition-all ${plannedCount >= 10 ? "scale-125" : plannedCount >= 5 ? "scale-110" : "scale-100"}`}
              style={{ fontSize: `${Math.min(42, 22 + plannedCount * 1.5)}px` }}
            >
              🔥
            </span>
            <span className="font-serif text-xs font-bold text-[#bc6c25]">{plannedCount}</span>
          </div>
        </div>

        {/* coach proposals */}
        {pending.length > 0 && (
          <section className="mb-8 space-y-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Your coach proposes…</h3>
            {pending.map((p) => (
              <div key={p.id} className="animate-rise flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-emerald-700/20 bg-emerald-50 px-4 py-3">
                <span className="rounded-md bg-emerald-600/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                  {p.kind.replace("-", " ")}
                </span>
                <span className="min-w-0 flex-1 text-sm">{p.summary}</span>
                <span className="flex gap-2">
                  <button onClick={() => approve(p.id)} className="rounded-lg bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-600">Approve ✓</button>
                  <button onClick={() => undo(p.id)} className="rounded-lg border border-stone-300 px-3.5 py-1.5 text-xs text-stone-600 hover:bg-white">Reject</button>
                </span>
              </div>
            ))}
          </section>
        )}

        {/* day story */}
        {storySlot && storySession && (
          <DayStory slot={storySlot} session={storySession} onClose={() => setStorySlot(null)} />
        )}

        {/* the grid */}
        <div className="overflow-x-auto rounded-2xl">
          <table className="w-full min-w-[720px] border-separate" style={{ borderSpacing: "0 10px" }}>
            <thead>
              <tr>
                <th />
                {DAYS.map((d) => (
                  <th key={d} className="pb-1 text-center font-serif text-sm font-semibold text-stone-500">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(["am", "pm"] as const).map((when) => (
                <tr key={when}>
                  <td className="w-16 pr-3 text-right align-middle text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                    {when === "am" ? "AM" : "PM"}
                  </td>
                  {DAYS.map((_, d) => {
                    const slot = `${d}-${when}` as Slot;
                    const s = plan[slot];
                    return (
                      <td key={slot} className="px-1">
                        {s ? (
                          <button
                            onClick={() => setStorySlot(slot)}
                            className={`group relative h-full w-full rounded-xl p-3 text-left transition-transform hover:-translate-y-0.5 hover:shadow-lg ${FOCUS_META[s.focus].chip}`}
                          >
                            <p className="text-[10px] font-bold uppercase tracking-wide opacity-70">{FOCUS_META[s.focus].icon} {s.focus}</p>
                            <p className="mt-0.5 font-serif text-sm font-semibold leading-tight">{s.title}</p>
                            <p className="mt-1 text-[11px] opacity-80">{s.minutes} min{s.refuel ? ` · 🍽️` : ""}</p>
                            <span
                              onClick={(e) => { e.stopPropagation(); clearSlot(slot); }}
                              title="Rest day"
                              className="absolute right-1.5 top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-black/10 text-xs hover:bg-black/25 group-hover:flex"
                            >
                              ×
                            </span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setSlotMenu(slot)}
                            className="group flex h-full min-h-[88px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-stone-300 text-stone-400 transition-all hover:border-emerald-600/50 hover:bg-emerald-50/40 hover:text-emerald-700"
                          >
                            <span className="text-lg leading-none transition-transform group-hover:scale-125">+</span>
                            <span className="mt-1 text-[11px] capitalize">{when}</span>
                            <span className="hidden text-[9px] italic opacity-60 group-hover:inline">{GHOST_COPY_KENYA[d]}</span>
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* gear */}
        {gear.length > 0 && (
          <section className="mt-10 rounded-2xl border border-[#e6e1d4] bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">One bag. All week.</p>
                <h3 className="mt-0.5 font-serif text-xl">Your gear list.</h3>
              </div>
              <a
                href={`https://wa.me/?text=${encodeURIComponent("My gym gear this week 🏋️: " + gear.map(([i, u]) => `${i} (×${u})`).join(", ") + " — planned with Gym & Tonic")}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-emerald-700 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-600"
              >
                Share via WhatsApp
              </a>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {gear.map(([item, uses]) => (
                <span key={item} className="rounded-full bg-[#f7f5ef] px-3 py-1 text-xs ring-1 ring-stone-200">
                  {item} <span className="text-stone-400">×{uses}</span>
                </span>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-stone-400">Aggregated from every planned session — packed once, used all week.</p>
          </section>
        )}

        {/* refuel spotlight */}
        {plannedCount > 0 && (
          <section className="mt-6 overflow-hidden rounded-2xl border border-[#e6e1d4] bg-white">
            <div className="bg-[#bc6c25] px-5 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white">Refuel of the moment</p>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-2 p-5">
              <p className="font-serif text-xl font-semibold">{spotlight.name}</p>
              <p className="text-xs italic text-stone-500">{spotlight.why}</p>
            </div>
          </section>
        )}

        <footer className="mt-12 text-center text-sm text-stone-400">
          An agent can fill the blanks, swap a session, or plan the whole week.{" "}
          <span className="italic">See how it works →</span>
        </footer>
      </main>

      {/* slot menu */}
      {slotMenu && <SlotMenu slot={slotMenu} onClose={() => setSlotMenu(null)} />}

      <CoachVoice mcpConnected={!!mcpStatus?.supported} />
    </div>
  );
}

function ProgressRing({ done, total }: { done: number; total: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, done / total);
  return (
    <div className="relative h-20 w-20 shrink-0 -my-2">
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#e6e1d4" strokeWidth="6" />
        <circle
          cx="32" cy="32" r={r} fill="none"
          stroke="#31572c" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-serif text-sm font-bold">
        {done}<span className="text-[10px] font-normal text-stone-400">/{total}</span>
      </span>
    </div>
  );
}

function SlotMenu({ slot, onClose }: { slot: Slot; onClose: () => void }) {
  const placeSession = usePlan((s) => s.placeSession);
  const [copied, setCopied] = useState(false);
  const [d, when] = slot.split("-");
  const dayName = DAYS[Number(d)];
  const whenName = when === "am" ? "Morning" : "Evening";
  const generate = (intensity: "light" | "moderate" | "brutal") => {
    const order = ["legs", "push", "pull", "core", "cardio", "mobility"] as const;
    const focus = order[Number(slot.split("-")[0]) % order.length];
    import("../lib/coach").then(({ generateSession }) => placeSession(slot, generateSession(focus, intensity)));
    onClose();
  };
  const coachPrompt = `Plan a ${when === "am" ? "morning" : "evening"} session for ${dayName} in Gym & Tonic — pick the muscle group my week is missing.`;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px] sm:items-center" onClick={onClose}>
      <div className="animate-rise w-full max-w-sm rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Fill the slot</p>
        <h3 className="mt-0.5 font-serif text-xl font-semibold">{dayName} · {whenName}</h3>
        <p className="mt-0.5 text-xs text-stone-400">Quick fill by intensity — or bring your coach along.</p>
        <div className="mt-4 space-y-2">
          {(
            [
              ["light", "Easy does it", "Short and kind"],
              ["moderate", "Proper session", "The usual honest work"],
              ["brutal", "Demolition", "A big one — hydrate well today"],
            ] as const
          ).map(([i, label, desc]) => (
            <button key={i} onClick={() => generate(i)} className="flex w-full items-center justify-between rounded-xl border border-stone-200 px-4 py-3 text-left transition-colors hover:border-emerald-600/40 hover:bg-emerald-50">
              <span>
                <span className="block text-sm font-medium">{label}</span>
                <span className="block text-xs text-stone-400">{desc}</span>
              </span>
              <span className="text-emerald-700">→</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(coachPrompt).then(
              () => setCopied(true),
              () => setCopied(false),
            );
          }}
          className="mt-4 w-full rounded-xl border border-dashed border-stone-300 px-4 py-2.5 text-xs text-stone-600 transition-colors hover:border-emerald-600/40 hover:bg-emerald-50"
        >
          {copied ? "✓ Copied — paste it to your coach in ChatGPT" : "📋 Copy a prompt for your ChatGPT coach"}
        </button>
        <button onClick={onClose} className="mt-3 w-full py-2 text-center text-xs font-medium text-stone-500 underline-offset-2 hover:text-stone-800 hover:underline">
          Rest day instead
        </button>
      </div>
    </div>
  );
}
