import { useEffect, useMemo, useRef, useState } from "react";
import { usePlan, DAYS } from "../lib/store";
import { registerAllTools } from "../lib/webmcp";
import { balanceCheck, gearList, generateSession } from "../lib/coach";
import { SceneImage } from "./ui/SceneImage";
import { DayStory } from "./ui/DayStory";
import { CoachVoice } from "./ui/CoachVoice";
import { Insights } from "./ui/Insights";
import { ConnectModal } from "./ui/ConnectModal";
import { SetupPanel } from "./ui/SetupPanel";
import { ProgressDashboard } from "./ui/ProgressDashboard";
import { ReflectionPanel } from "./ui/ReflectionPanel";
import { WorkoutMode } from "./ui/WorkoutMode";
import { DataControls } from "./ui/DataControls";
import { ConnectionStatus } from "./ui/ConnectionStatus";
import { PlanningTools } from "./ui/PlanningTools";
import { GHOST_COPY, greetingEat, REFUEL_CATALOG, refuelIdsFromSessions } from "../lib/kenyanFlavor";
import { saveWeek, currentWeekKey } from "../lib/history";
import type { SessionGenerationOptions, Slot } from "../lib/types";
import { sound } from "../lib/sound";
import { FOCUS_META, GROUPS, intensityLabel, weekPhase } from "../lib/plannerMeta";

/** Ask the coach voice to say something. */
function enqueueCoachLine(text: string) {
  window.dispatchEvent(new CustomEvent("gt-coach-say", { detail: text }));
}

export default function Planner() {
  const plan = usePlan((s) => s.plan);
  const preferences = usePlan((s) => s.preferences);
  const hasStarted = usePlan((s) => s.hasStarted);
  const setupDismissed = usePlan((s) => s.setupDismissed);
  const proposals = usePlan((s) => s.proposals);
  const approve = usePlan((s) => s.approveProposal);
  const reject = usePlan((s) => s.rejectProposal);
  const clearSlot = usePlan((s) => s.clearSlot);
  const placeSession = usePlan((s) => s.placeSession);
  const completions = usePlan((s) => s.completions);
  const completeSession = usePlan((s) => s.completeSession);
  const uncompleteSession = usePlan((s) => s.uncompleteSession);
  const updateCompletion = usePlan((s) => s.updateCompletion);
  const startNextWeek = usePlan((s) => s.startNextWeek);
  const reviewWeek = usePlan((s) => s.reviewWeek);
  const activeWorkout = usePlan((s) => s.activeWorkout);
  const startWorkout = usePlan((s) => s.startWorkout);
  const [mcpStatus, setMcpStatus] = useState<import("../lib/webmcp").WebMCPStatus | null>(null);
  const [slotMenu, setSlotMenu] = useState<Slot | null>(null);
  const [storySlot, setStorySlot] = useState<Slot | null>(null);
  const stampedRef = useRef(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const setupRef = useRef<HTMLDivElement>(null);
  const [hydrated, setHydrated] = useState(false);
  const [reflectionSlot, setReflectionSlot] = useState<Slot | null>(null);
  const [showCompletedOnly, setShowCompletedOnly] = useState(false);
  const [workoutOpen, setWorkoutOpen] = useState(false);
  const [boardView, setBoardView] = useState<"day" | "week">("day");
  const [selectedDay, setSelectedDay] = useState(((new Date().getDay() + 6) % 7) as number);

  useEffect(() => {
    registerAllTools().then(setMcpStatus).catch(console.error);
    setHydrated(true);
  }, []);

  const pending = proposals.filter((p) => p.state === "pending");
  const sessions = useMemo(() => Object.values(plan), [plan]);
  const usedRefuelIds = useMemo(() => refuelIdsFromSessions(sessions), [sessions]);
  const balance = useMemo(() => balanceCheck(sessions), [sessions]);
  const gear = useMemo(() => Object.entries(gearList(sessions)), [sessions]);
  const plannedCount = sessions.length;
  const complete = plannedCount === 14;

  useEffect(() => {
    if (complete && !stampedRef.current) {
      stampedRef.current = true;
      sound.sting(true);
      // archive this week so next week's overload report has history
      const completedMinutes = Object.entries(plan).reduce((total, [slot, session]) => total + (completions[slot as Slot] ? session.minutes : 0), 0);
      saveWeek(currentWeekKey(), sessions, completions, completedMinutes);
    }
    if (!complete) stampedRef.current = false;
  }, [complete, sessions, completions]);

  const storySession = storySlot ? plan[storySlot] : null;
  const greeting = useMemo(() => greetingEat(new Date().getHours()), []);
  const coveredGroups = useMemo(() => new Set(sessions.map((s) => s.focus)), [sessions]);
  const spotlight = useMemo(() => {
    const usedDetails = sessions.flatMap((session) => session.refuelDetail ? [session.refuelDetail] : []);
    return usedDetails[plannedCount % Math.max(1, usedDetails.length)] ?? REFUEL_CATALOG[plannedCount % REFUEL_CATALOG.length];
  }, [plannedCount, sessions]);
  const showSetup = hydrated && !setupDismissed && !complete && (!hasStarted || plannedCount < 2);
  const preferredDays = (preferences.trainingDays ?? ([0, 1, 2, 3, 4] as const)).filter((day) => !(preferences.restDays ?? []).includes(day));
  const generationOptions: SessionGenerationOptions = useMemo(() => ({ duration: preferences.duration, equipment: preferences.equipment, lowImpact: preferences.lowImpact ?? true, excludeRefuelIds: usedRefuelIds }), [preferences.duration, preferences.equipment, preferences.lowImpact, usedRefuelIds]);

  const startFirstSession = () => {
    const focus = preferences.goal === "weight-loss" ? "cardio" : preferences.goal === "build-strength" ? "legs" : balance.neglected[0] as Parameters<typeof generateSession>[0] ?? "legs";
    const firstDay = preferredDays[0] ?? 0;
    placeSession(`${firstDay}-pm`, generateSession(focus, preferences.intensity, generationOptions));
  };

  const fillWeekManually = () => {
    const focusOrder = (balance.neglected.length ? balance.neglected : GROUPS) as Parameters<typeof generateSession>[0][];
    const used = [...usedRefuelIds];
    preferredDays.forEach((day, index) => {
      const slot = `${day}-pm` as Slot;
      if (!plan[slot]) {
        const goalFocus = preferences.goal === "weight-loss" && index % 3 === 1 ? "cardio" : preferences.goal === "build-strength" && index % 3 !== 1 ? "legs" : focusOrder[index % focusOrder.length];
        const session = generateSession(goalFocus, preferences.intensity, { ...generationOptions, excludeRefuelIds: used });
        if (session.refuelDetail) used.push(session.refuelDetail.id);
        placeSession(slot, session);
      }
    });
  };

  const askCoach = () => {
    if (mcpStatus?.supported) enqueueCoachLine("I’m looking at the week. Tell me what you want to train, and I’ll help shape it.");
    else setShowConnectModal(true);
  };

  const todayDay = ((new Date().getDay() + 6) % 7) as number;
  const todayWhen = new Date().getHours() < 15 ? "am" : "pm";
  const todaySlot = `${todayDay}-${todayWhen}` as Slot;
  const todaySession = plan[todaySlot];
  const activeWorkoutIsToday = activeWorkout?.slot === todaySlot;
  const openWorkout = (slot: Slot) => {
    if (startWorkout(slot) || activeWorkout?.slot === slot) window.setTimeout(() => { window.location.href = `/workout?slot=${encodeURIComponent(slot)}`; }, 0);
    else if (activeWorkout) window.setTimeout(() => { window.location.href = "/workout"; }, 0);
  };

  // The saved plan exists only in the browser. Render a stable shell first so
  // Astro's server markup never races localStorage during React hydration.
  if (!hydrated) {
    return <div className="min-h-screen bg-[#f7f5ef]" aria-busy="true" aria-label="Loading your training board" />;
  }

  return (
    <div className={`grain min-h-screen bg-[#f7f5ef] text-[#26251f] transition-opacity duration-200 ${hydrated ? "opacity-100" : "opacity-0"}`}>
      {/* header */}
      <header className="sticky top-0 z-30 border-b border-[#e6e1d4] bg-[#f7f5ef]/90 backdrop-blur">
        <ConnectionStatus />
        <div className="mx-auto flex max-w-6xl items-center gap-x-5 px-5 py-3">
          <a href="/" aria-label="Gym and Tonic home" className="font-serif text-lg font-semibold tracking-tight">
            gym<span className="text-emerald-700">&amp;</span>tonic
          </a>
          <span className="hidden text-sm italic text-stone-400 sm:inline">a little less “should I train today?”</span>
          <div className="hidden items-center gap-1 rounded-full border border-[#e6e1d4] bg-white p-1 md:flex">
            {[['today', 'Today', '/today'], ['plan', 'Plan', '/plan'], ['progress', 'Progress', '/progress'], ['meals', 'Meals', '/meals']].map(([id, label, href]) => <a key={id} href={href} aria-current={id === 'plan' ? 'page' : undefined} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${id === 'plan' ? 'bg-[#31572c] text-white' : 'text-stone-500 hover:text-stone-900'}`}>{label}</a>)}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <a href="/tools" className="hidden rounded-full px-3 py-1.5 text-xs font-semibold text-stone-500 hover:bg-white hover:text-emerald-800 lg:inline">Coach tools</a>
            <a href="/settings" aria-current={undefined} className="hidden rounded-full px-3 py-1.5 text-xs font-semibold text-stone-500 hover:bg-white hover:text-emerald-800 sm:inline">Settings</a>
            <DataControls />
            {mcpStatus && !mcpStatus.supported && (
              <button
                onClick={() => setShowConnectModal(true)}
                title="Connect Claude Desktop, Cursor or any MCP client as your coach"
                className="rounded-full bg-emerald-700 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-600 active:scale-[0.98]"
              >
                ⚡ Connect your coach
              </button>
            )}
            {mcpStatus?.supported && (
              <span
                title="Your AI coach can plan sessions through this page's site tools."
                className="inline-flex cursor-help items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-600/20"
              >
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
                Coach connected · {mcpStatus.registered} tools
              </span>
            )}
          </div>
        </div>
      </header>

      <nav className="mx-auto grid max-w-6xl grid-cols-4 border-b border-[#e6e1d4] bg-[#f7f5ef] px-2 py-1 md:hidden" aria-label="App navigation">
        {[['today', 'Today', '/today'], ['plan', 'Plan', '/plan'], ['progress', 'Progress', '/progress'], ['meals', 'Meals', '/meals']].map(([id, label, href]) => <a key={id} href={href} aria-current={id === 'plan' ? 'page' : undefined} className={`min-h-11 py-3 text-center text-[11px] font-bold ${id === 'plan' ? 'text-[#31572c]' : 'text-stone-500'}`}>{label}</a>)}
      </nav>

      <main className="relative mx-auto max-w-6xl px-5 pb-24 pt-8">
        {/* hero */}
        <section className="animate-rise relative mb-8 overflow-hidden rounded-3xl shadow-lg">
          <SceneImage scene="hero-week" kenburns className="h-56 sm:h-64">
            <div className="flex h-full flex-col justify-end bg-gradient-to-t from-black/70 via-black/25 to-black/40 p-7 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] drop-shadow-md">
                <span className="rounded bg-black/35 px-2 py-0.5 backdrop-blur-sm">{weekPhase(plannedCount)}</span>
              </p>
              <h2 className="mt-2 max-w-3xl font-serif text-3xl font-semibold tracking-tight drop-shadow-lg sm:text-5xl">
                {greeting.hello} Your week, well trained.
              </h2>
              <p className="mt-2 max-w-md text-sm opacity-90">
                {greeting.hint}{" "}
                {14 - plannedCount > 0
                  ? `${14 - plannedCount} chances to move something this week.`
                  : "A full week on the board. Show-off."}
              </p>
              {showSetup && <button onClick={() => setupRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })} className="button-primary mt-4 w-fit bg-white text-emerald-900 hover:bg-emerald-50">Plan my first session <span aria-hidden="true">↓</span></button>}
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

        {showSetup && <div ref={setupRef}><SetupPanel onStart={startFirstSession} onFillWeek={fillWeekManually} onAskCoach={askCoach} /></div>}

        {activeWorkout && !workoutOpen && <section className="surface-card mb-6 flex flex-wrap items-center justify-between gap-4 border-amber-500/30 bg-amber-50 px-5 py-4" aria-label={activeWorkoutIsToday ? "Today's workout in progress" : "Workout in progress"}>
          <div><p className="eyebrow text-amber-800">{activeWorkoutIsToday ? `Workout in progress · Today’s ${todayWhen === "am" ? "morning" : "evening"}` : "Workout in progress"}</p><p className="mt-1 font-serif text-xl font-semibold">{plan[activeWorkout.slot]?.title ?? "Your session"}</p><p className="text-xs text-stone-500">Your progress and timer are saved on this device.</p></div>
          <div className="flex flex-wrap gap-2"><button onClick={() => window.location.href = "/workout"} className="button-primary bg-amber-700 hover:bg-amber-600">Resume workout</button>{activeWorkoutIsToday && !completions[todaySlot] && <button onClick={() => completeSession(todaySlot) && setReflectionSlot(todaySlot)} className="button-secondary">Mark complete</button>}</div>
        </section>}

        {todaySession && !activeWorkoutIsToday && <section className="surface-card mb-6 flex flex-wrap items-center justify-between gap-4 border-emerald-700/20 bg-emerald-50/60 px-5 py-4" aria-label="Today's session">
          <div><p className="eyebrow text-emerald-700">Today’s session · {todayWhen === "am" ? "Morning" : "Evening"}</p><p className="mt-1 font-serif text-xl font-semibold">{todaySession.title}</p><p className="text-xs text-stone-500">{todaySession.minutes} minutes · {todaySession.focus}</p></div>
          <div className="flex flex-wrap gap-2">{completions[todaySlot] ? <button onClick={() => setStorySlot(todaySlot)} className="button-secondary">Completed ✓ · view</button> : <><button onClick={() => openWorkout(todaySlot)} className="button-primary">Start workout</button><button onClick={() => completeSession(todaySlot) && setReflectionSlot(todaySlot)} className="button-secondary">Mark complete</button></>}</div>
        </section>}

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
            {pending.map((p) => {
              const isAgent = p.toolSource !== "manual";
              return (
              <div key={p.id} className="animate-rise flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-emerald-700/20 bg-emerald-50 px-4 py-3">
                <span className="rounded-md bg-emerald-600/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                  {p.kind.replace("-", " ")}
                </span>
                <span className="min-w-0 flex-1 text-sm">{p.summary}</span>
                <span className="flex gap-2">
                  <button onClick={() => { approve(p.id); if (isAgent) enqueueCoachLine("Good call. Into the programme."); }} className="rounded-lg bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-600">Approve ✓</button>
                  <button onClick={() => reject(p.id)} aria-label={`Reject proposal: ${p.summary}`} className="rounded-lg border border-stone-300 px-3.5 py-1.5 text-xs text-stone-600 hover:bg-white">Reject</button>
                  {isAgent && (
                    <button
                      onClick={() => enqueueCoachLine(`Fair challenge. ${p.summary} — but check_balance says the gap is real. Want a lighter version instead?`)}
                      title="Ask your coach to defend this proposal"
                      className="rounded-lg border border-stone-300 px-3.5 py-1.5 text-xs text-stone-600 hover:bg-white"
                    >
                      🤔 Why?
                    </button>
                  )}
                </span>
              </div>
              );
            })}
          </section>
        )}

        {/* day story */}
        {storySlot && storySession && (
          <DayStory
            slot={storySlot}
            session={storySession}
            completion={completions[storySlot]}
            onClose={() => setStorySlot(null)}
            onComplete={() => { if (completeSession(storySlot)) setReflectionSlot(storySlot); }}
            onUndoComplete={() => uncompleteSession(storySlot)}
            onReflect={() => setReflectionSlot(storySlot)}
            onStartWorkout={() => openWorkout(storySlot)}
          />
        )}

        {/* the grid */}
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <div><p className="eyebrow text-stone-400">The week at a glance</p><h2 className="font-serif text-2xl font-semibold">Your training board.</h2></div>
          <div className="flex items-center gap-2"><div className="flex rounded-full border border-[var(--line)] bg-white p-1" role="group" aria-label="Board view"><button onClick={() => setBoardView("day")} aria-pressed={boardView === "day"} className={`rounded-full px-3 py-1.5 text-[11px] font-bold md:hidden ${boardView === "day" ? "bg-[var(--sage-deep)] text-white" : "text-stone-500"}`}>Selected day</button><button onClick={() => setBoardView("week")} aria-pressed={boardView === "week"} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${boardView === "week" ? "bg-[var(--sage-deep)] text-white" : "text-stone-500"}`}>Full week</button></div>{plannedCount > 0 && <button onClick={() => setShowCompletedOnly((value) => !value)} aria-pressed={showCompletedOnly} className="button-secondary px-3 py-2 text-[11px]">{showCompletedOnly ? "Showing completed" : "Completed only"}</button>}</div>
        </div>
        <div className="mb-3 flex gap-1 overflow-x-auto pb-1 md:hidden" aria-label="Choose a day">{DAYS.map((day, index) => <button key={day + index} onClick={() => setSelectedDay(index)} aria-pressed={selectedDay === index} className={`min-h-11 min-w-11 rounded-xl px-2 text-xs font-bold ${selectedDay === index ? "bg-[var(--sage-deep)] text-white" : "border border-[var(--line)] bg-white text-stone-500"}`}>{day}</button>)}</div>
        <p className="mb-2 text-xs text-stone-500 md:hidden">Selected day shows morning and evening. Choose Full week to swipe across all seven days.</p>
        <div className="mb-4 grid gap-3 md:hidden">{boardView === "day" && (["am", "pm"] as const).map((when) => { const slot = `${selectedDay}-${when}` as Slot; const s = plan[slot]; return s ? <div key={slot} className={`surface-card p-4 ${showCompletedOnly && !completions[slot] ? "hidden" : ""}`}><p className="eyebrow text-[var(--sage)]">{DAYS[selectedDay]} · {when === "am" ? "Morning" : "Evening"}</p><h3 className="mt-1 font-serif text-xl font-semibold">{s.title}</h3><p className="mt-1 text-sm text-stone-500">{s.minutes} min · {s.intensity}</p><div className="mt-3 flex flex-wrap gap-2"><button className="button-secondary" onClick={() => setStorySlot(slot)}>View details</button><button className="button-primary" onClick={() => openWorkout(slot)} disabled={!!completions[slot]}>Start workout</button><button className="button-secondary" aria-pressed={!!completions[slot]} onClick={() => completions[slot] ? uncompleteSession(slot) : completeSession(slot) && setReflectionSlot(slot)}>{completions[slot] ? "✓ Done" : "Mark done"}</button></div></div> : <button key={slot} onClick={() => setSlotMenu(slot)} className="flex min-h-[96px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 text-sm text-stone-500 hover:border-emerald-600 hover:text-emerald-700" aria-label={`Add a ${when} session on ${DAYS[selectedDay]}`}>+ Add {when === "am" ? "morning" : "evening"} session</button>; })}</div>
        <div className={`${boardView === "week" ? "block" : "hidden md:block"} overflow-x-auto rounded-2xl pb-2`}>
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
                          <div className={`group relative h-full w-full rounded-xl p-3 text-left transition-transform hover:-translate-y-0.5 hover:shadow-lg ${FOCUS_META[s.focus].chip} ${showCompletedOnly && !completions[slot] ? "hidden" : ""} ${slot === todaySlot ? "ring-2 ring-emerald-700 ring-offset-2" : ""}`}>
                            <button
                              onClick={() => setStorySlot(slot)}
                              aria-label={`Open ${s.title} details for ${DAYS[d]} ${when}`}
                              className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                            >
                            <p className="text-[10px] font-bold uppercase tracking-wide opacity-70">{FOCUS_META[s.focus].icon} {s.focus}</p>
                            <p className="mt-0.5 font-serif text-sm font-semibold leading-tight">{s.title}</p>
                            <p className="mt-1 text-[11px] opacity-80">{s.minutes} min · {intensityLabel(s.intensity)}{s.refuel ? ` · 🍽️` : ""}</p>
                            </button>
                            <button onClick={() => completions[slot] ? uncompleteSession(slot) : completeSession(slot) && setReflectionSlot(slot)} aria-pressed={!!completions[slot]} aria-label={completions[slot] ? `Mark ${s.title} incomplete` : `Mark ${s.title} complete`} className={`mt-3 rounded-full px-2.5 py-1 text-[10px] font-bold transition ${completions[slot] ? "bg-emerald-700 text-white" : "bg-black/10 text-black/60 hover:bg-emerald-700 hover:text-white"}`}>{completions[slot] ? "✓ Done" : "Mark done"}</button>
                            {!completions[slot] && <button onClick={() => openWorkout(slot)} aria-label={`Start guided workout for ${s.title}`} className="mt-3 ml-1 rounded-full border border-black/15 px-2.5 py-1 text-[10px] font-bold text-black/60 transition hover:bg-black/10">Start</button>}
                            <button onClick={() => setSlotMenu(slot)} aria-label={`Replace ${s.title}`} className="absolute bottom-1.5 right-2 hidden text-[10px] font-semibold text-black/50 underline-offset-2 hover:underline group-hover:block focus:block">Replace</button>
                            <button
                              onClick={(e) => { e.stopPropagation(); if (activeWorkout?.slot === slot && !window.confirm("This workout is in progress. Clear the session and discard its saved workout progress?")) return; clearSlot(slot); }}
                              title="Rest day"
                              aria-label={`Clear ${DAYS[d]} ${when} session and make it a rest day`}
                              className="absolute right-1.5 top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-black/10 text-xs hover:bg-black/25 group-hover:flex focus:flex"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSlotMenu(slot)}
                            aria-label={`Add a ${when} session on ${DAYS[d]}`}
                            className="group flex h-full min-h-[88px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-stone-300 text-stone-400 transition-all hover:border-emerald-600/50 hover:bg-emerald-50/40 hover:text-emerald-700"
                          >
                            <span className="text-lg leading-none transition-transform group-hover:scale-125">+</span>
                            <span className="mt-1 text-[11px] capitalize">Add {when} session</span>
                            <span className="hidden text-[9px] italic opacity-60 group-hover:inline">{GHOST_COPY[d]}</span>
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

        {plannedCount > 0 && <ProgressDashboard onReview={reviewWeek} onNextWeek={startNextWeek} />}

        <PlanningTools />

        {/* insights: volume + overload */}
        {plannedCount > 0 && <Insights />}

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
              <div><p className="font-serif text-xl font-semibold">{spotlight.title}</p><p className="mt-1 text-sm text-stone-600">{spotlight.plate}</p></div>
              <p className="text-xs italic text-stone-500">{spotlight.reason}</p>
            </div>
          </section>
        )}

        <footer className="mt-12 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center text-sm text-stone-500">
          <span>An agent can fill the blanks, swap a session, or plan the whole week.</span>
          <a href="/" className="font-semibold text-emerald-800 underline underline-offset-4">How it works →</a>
          <a href="/privacy" className="underline underline-offset-4">Privacy</a>
        </footer>
      </main>

      {/* slot menu */}
      {slotMenu && <SlotMenu slot={slotMenu} activeWorkoutSlot={activeWorkout?.slot} onClose={() => setSlotMenu(null)} />}

      {showConnectModal && <ConnectModal onConnected={() => setShowConnectModal(false)} />}

      {reflectionSlot && completions[reflectionSlot] && <ReflectionPanel entry={completions[reflectionSlot]!} onSave={(input) => updateCompletion(reflectionSlot, input)} onClose={() => setReflectionSlot(null)} />}

      {workoutOpen && activeWorkout && plan[activeWorkout.slot] && <WorkoutMode session={plan[activeWorkout.slot]} onClose={() => setWorkoutOpen(false)} onFinished={() => { const slot = activeWorkout.slot; setWorkoutOpen(false); setReflectionSlot(slot); }} />}

      <CoachVoice mcpConnected={!!mcpStatus?.supported} />
    </div>
  );
}

function ProgressRing({ done, total }: { done: number; total: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, done / total);
  return (
    <div className="relative h-20 w-20 shrink-0 -my-2" role="img" aria-label={`${done} of ${total} sessions planned`}>
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

function SlotMenu({ slot, onClose, activeWorkoutSlot }: { slot: Slot; onClose: () => void; activeWorkoutSlot?: Slot }) {
  const preferences = usePlan((s) => s.preferences);
  const plan = usePlan((s) => s.plan);
  const [copied, setCopied] = useState(false);
  const [selectedIntensity, setSelectedIntensity] = useState(preferences.intensity);
  const [d, when] = slot.split("-");
  const dayName = DAYS[Number(d)];
  const whenName = when === "am" ? "Morning" : "Evening";
  const focus = (["legs", "push", "pull", "core", "cardio", "mobility"] as const)[Number(d) % 6];
  const refuelOptions = useMemo(() => ({ ...preferences, excludeRefuelIds: refuelIdsFromSessions(Object.values(plan)) }), [plan, preferences]);
  const preview = useMemo(() => generateSession(focus, selectedIntensity, refuelOptions), [focus, selectedIntensity, refuelOptions]);
  const generate = (intensity: "light" | "moderate" | "brutal") => {
    setSelectedIntensity(intensity);
    if (activeWorkoutSlot === slot && !window.confirm("This workout is in progress. Replace the session and discard its saved workout progress?")) return;
    usePlan.getState().placeSession(slot, intensity === selectedIntensity ? preview : generateSession(focus, intensity, refuelOptions));
    onClose();
  };
  const coachPrompt = `Plan a ${when === "am" ? "morning" : "evening"} session for ${dayName} in Gym & Tonic — pick the muscle group my week is missing.`;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px] sm:items-center" onClick={onClose}>
      <div className="animate-rise w-full max-w-sm rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="slot-menu-heading">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Shape the session</p>
        <h3 id="slot-menu-heading" className="mt-0.5 font-serif text-xl font-semibold">{dayName} · {whenName}</h3>
        <p className="mt-0.5 text-xs text-stone-400">Choose an effort level. We’ll build a session around your board.</p>
        <div className="mt-4 rounded-xl bg-[var(--paper)] p-4">
          <p className="eyebrow text-stone-400">Preview</p>
          <p className="mt-1 font-serif text-lg font-semibold">{preview.title}</p>
          <p className="mt-1 text-xs text-stone-500">{preview.minutes} min · {preview.focus} · {preview.exercises.length} exercises{preview.refuel ? ` · ${preview.refuel}` : ""}</p>
        </div>

        <div className="mt-4 space-y-2">
          {(
            [
              ["light", "Easy does it", "Short and kind"],
              ["moderate", "Proper session", "The usual honest work"],
              ["brutal", "Demolition", "A big one — hydrate well today"],
            ] as const
          ).map(([i, label, desc]) => (
            <button key={i} onClick={() => generate(i)} aria-pressed={selectedIntensity === i} className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors hover:border-emerald-600/40 hover:bg-emerald-50 ${selectedIntensity === i ? "border-emerald-700 bg-emerald-50" : "border-stone-200"}`}>
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
