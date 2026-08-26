import { useEffect, useMemo, useState } from "react";
import { usePlan, DAYS } from "../lib/store";
import type { Slot } from "../lib/store";
import { registerAllTools } from "../lib/webmcp";
import { exerciseById, balanceCheck, gearList } from "../lib/coach";

const FOCUS_META: Record<string, { icon: string; chip: string }> = {
  legs: { icon: "🦵", chip: "bg-orange-100 text-orange-800" },
  push: { icon: "💪", chip: "bg-sky-100 text-sky-800" },
  pull: { icon: "🪢", chip: "bg-violet-100 text-violet-800" },
  core: { icon: "🎯", chip: "bg-lime-100 text-lime-800" },
  cardio: { icon: "❤️", chip: "bg-rose-100 text-rose-800" },
  mobility: { icon: "🧘", chip: "bg-teal-100 text-teal-800" },
};

export default function Planner() {
  const plan = usePlan((s) => s.plan);
  const proposals = usePlan((s) => s.proposals);
  const approve = usePlan((s) => s.approveProposal);
  const undo = usePlan((s) => s.undoProposal);
  const placeSession = usePlan((s) => s.placeSession);
  const clearSlot = usePlan((s) => s.clearSlot);
  const [mcpStatus, setMcpStatus] = useState<{ supported: boolean; registered: number } | null>(null);
  const [slotMenu, setSlotMenu] = useState<Slot | null>(null);

  useEffect(() => {
    registerAllTools().then(setMcpStatus).catch(console.error);
  }, []);

  const pending = proposals.filter((p) => p.state === "pending");
  const sessions = useMemo(() => Object.values(plan), [plan]);
  const balance = useMemo(() => balanceCheck(sessions), [sessions]);
  const plannedCount = sessions.length;

  return (
    <div className="min-h-screen bg-[#f9f7f2] text-[#2b2b28]">
      {/* header */}
      <header className="sticky top-0 z-30 border-b border-[#e8e4da] bg-[#f9f7f2]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-x-5 px-5 py-3">
          <h1 className="font-serif text-lg font-semibold tracking-tight">
            gym<span className="text-emerald-700">&amp;</span>tonic
          </h1>
          <span className="hidden text-sm italic text-stone-400 sm:inline">a little less “should I train today?”</span>
          <div className="ml-auto flex items-center gap-2">
            {mcpStatus && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  mcpStatus.supported
                    ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-600/20"
                    : "bg-stone-200/60 text-stone-500"
                }`}
              >
                {mcpStatus.supported ? `WebMCP · ${mcpStatus.registered} tools` : "solo mode"}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-24 pt-8">
        {/* hero */}
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700/80">A fresh little start</p>
        <h2 className="mt-1.5 font-serif text-4xl tracking-tight">Your week, well trained.</h2>
        <p className="mt-2 text-stone-500">{14 - plannedCount > 0 ? `${14 - plannedCount} chances to move something.` : "A full week. Show-off."}</p>

        {/* progress */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e8e4da] bg-white px-5 py-3.5">
          <div>
            <p className="text-sm font-medium">{plannedCount} of 14 sessions planned</p>
            <p className="text-xs text-stone-400">
              {balance.totalMinutes} minutes ·{" "}
              {balance.neglected.length === 0
                ? balance.verdict
                : `skipped: ${balance.neglected.join(", ")}`}
            </p>
          </div>
          <div className="h-2 w-40 overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all duration-700"
              style={{ width: `${(plannedCount / 14) * 100}%` }}
            />
          </div>
        </div>

        {/* agent proposals */}
        {pending.length > 0 && (
          <section className="mt-6 space-y-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Your coach proposes…
            </h3>
            {pending.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-emerald-700/20 bg-emerald-50 px-4 py-3">
                <span className="rounded-md bg-emerald-600/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                  {p.kind.replace("-", " ")}
                </span>
                <span className="min-w-0 flex-1 text-sm">{p.summary}</span>
                <span className="flex gap-2">
                  <button onClick={() => approve(p.id)} className="rounded-lg bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600">Approve</button>
                  <button onClick={() => undo(p.id)} className="rounded-lg border border-stone-300 px-3.5 py-1.5 text-xs text-stone-600 hover:bg-stone-50">Reject</button>
                </span>
              </div>
            ))}
          </section>
        )}

        {/* the grid */}
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[720px] border-separate" style={{ borderSpacing: "0 10px" }}>
            <thead>
              <tr>
                <th />
                {DAYS.map((d) => (
                  <th key={d} className="pb-1 text-center font-serif text-sm font-semibold text-stone-600">{d}</th>
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
                          <div className={`group relative h-full rounded-xl p-3 ${FOCUS_META[s.focus].chip}`}>
                            <p className="text-[10px] font-bold uppercase tracking-wide opacity-70">{FOCUS_META[s.focus].icon} {s.focus}</p>
                            <p className="mt-0.5 font-serif text-sm font-semibold leading-tight">{s.title}</p>
                            <p className="mt-1 text-[11px] opacity-80">{s.minutes} min{s.refuel ? ` · 🍽️ ${s.refuel}` : ""}</p>
                            <button
                              onClick={() => clearSlot(slot)}
                              title="Rest day"
                              className="absolute right-1.5 top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-black/10 text-xs hover:bg-black/20 group-hover:flex"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSlotMenu(slot)}
                            className="flex h-full min-h-[84px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-stone-300 text-stone-400 transition-colors hover:border-emerald-600/40 hover:text-emerald-700"
                          >
                            <span className="text-lg leading-none">+</span>
                            <span className="mt-1 text-[11px] capitalize">add {when}</span>
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

        {/* gear list */}
        <GearList />

        <footer className="mt-12 text-center text-sm text-stone-400">
          An agent can fill the blanks, swap a session, or plan the whole week.{" "}
          <span className="italic">See how it works →</span>
        </footer>
      </main>

      {/* slot menu */}
      {slotMenu && <SlotMenu slot={slotMenu} onClose={() => setSlotMenu(null)} />}
    </div>
  );
}

function SlotMenu({ slot, onClose }: { slot: Slot; onClose: () => void }) {
  const placeSession = usePlan((s) => s.placeSession);
  const applyProposal = usePlan((s) => s.applyProposal);
  const generate = (intensity: "light" | "moderate" | "brutal") => {
    // rotate focus by day so menus feel varied
    const order = ["legs", "push", "pull", "core", "cardio", "mobility"] as const;
    const focus = order[Number(slot.split("-")[0]) % order.length];
    import("../lib/coach").then(({ generateSession }) => {
      const session = generateSession(focus, intensity);
      placeSession(slot, session);
    });
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-sm rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-serif text-lg font-semibold">Fill {slot.replace("-", " · ")}</h3>
        <p className="mt-0.5 text-xs text-stone-400">Quick fill by intensity — or ask your coach in ChatGPT.</p>
        <div className="mt-4 space-y-2">
          {(
            [
              ["light", "Easy does it", "Short and kind"],
              ["moderate", "Proper session", "The usual honest work"],
              ["brutal", "Demolition", "Bring water. Bring excuses."],
            ] as const
          ).map(([i, label, desc]) => (
            <button key={i} onClick={() => generate(i)} className="flex w-full items-center justify-between rounded-xl border border-stone-200 px-4 py-3 text-left hover:border-emerald-600/40 hover:bg-emerald-50">
              <span>
                <span className="block text-sm font-medium">{label}</span>
                <span className="block text-xs text-stone-400">{desc}</span>
              </span>
              <span>→</span>
            </button>
          ))}
        </div>
        <button onClick={() => { applyProposal({ kind: "clear", summary: "Rest day requested via menu", toolSource: "manual", payload: { slot } }); onClose(); }} className="mt-3 w-full py-2 text-center text-xs text-stone-400 hover:text-stone-600">
          Actually… rest day.
        </button>
      </div>
    </div>
  );
}

function GearList() {
  const plan = usePlan((s) => s.plan);
  const items = useMemo(() => Object.entries(gearList(Object.values(plan))), [plan]);

  if (!items.length) return null;
  return (
    <section className="mt-10 rounded-2xl border border-[#e8e4da] bg-white p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">One bag. All week.</p>
      <h3 className="mt-0.5 font-serif text-xl">Your gear list.</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map(([item, uses]) => (
          <span key={item} className="rounded-full bg-[#f9f7f2] px-3 py-1 text-xs ring-1 ring-stone-200">
            {item} <span className="text-stone-400">×{uses}</span>
          </span>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-stone-400">Aggregated from every planned session — packed once, used all week.</p>
    </section>
  );
}
