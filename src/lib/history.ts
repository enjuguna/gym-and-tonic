// Phase 2: training history, progressive overload, PR tracking.
// History persists per week-key in localStorage via the store.

import type { CompletionMap, MuscleGroup, Session, Slot } from "./types";

export interface WeekRecord {
  weekKey: string; // e.g. "2026-W35"
  sessions: Session[];
  completedAt: number;
  completions?: CompletionMap;
  completedMinutes?: number;
  plannedMinutes?: number;
  completedCount?: number;
  archivedAt?: number;
}

export interface OverloadInsight {
  focus: string;
  lastWeekMinutes: number;
  thisWeekMinutes: number;
  deltaPct: number;
  advice: string;
}

const KEY = "gt_history";

export function loadHistory(): WeekRecord[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveWeek(weekKey: string, sessions: Session[], completions: CompletionMap = {}, completedMinutes?: number) {
  if (!sessions.length) return;
  const hist = loadHistory().filter((w) => w.weekKey !== weekKey);
  hist.push({ weekKey, sessions, completions, completedMinutes, plannedMinutes: sessions.reduce((total, session) => total + session.minutes, 0), completedCount: Object.keys(completions).length, archivedAt: Date.now(), completedAt: Date.now() });
  try {
    localStorage.setItem(KEY, JSON.stringify(hist.slice(-12))); // keep 12 weeks
  } catch { /* private mode */ }
}

export interface ProgressReport {
  plannedCount: number;
  completedCount: number;
  plannedMinutes: number;
  completedMinutes: number;
  consistencyPct: number;
  currentStreak: number;
  bestWeek: { weekKey: string; completedCount: number } | null;
  totalCompletedSessions: number;
  completedGroups: MuscleGroup[];
  guidance: string;
}

export function progressReport(
  plan: Record<string, Session>,
  completions: CompletionMap,
  history: WeekRecord[] = [],
): ProgressReport {
  const entries = Object.entries(plan);
  const completedEntries = entries.filter(([slot]) => !!completions[slot as Slot]);
  const plannedMinutes = entries.reduce((total, [, session]) => total + session.minutes, 0);
  const completedMinutes = completedEntries.reduce((total, [, session]) => total + session.minutes, 0);
  const orderedCompleted = completedEntries
    .map(([slot]) => Number(slot.split("-")[0]) * 2 + (slot.endsWith("pm") ? 1 : 0))
    .sort((a, b) => a - b);
  let currentStreak = orderedCompleted.length ? 1 : 0;
  for (let i = orderedCompleted.length - 1; i > 0 && orderedCompleted[i] === orderedCompleted[i - 1] + 1; i--) currentStreak++;
  const completedGroups = [...new Set(completedEntries.map(([, session]) => session.focus))] as MuscleGroup[];
  const historicalCompleted = history.reduce((total, week) => total + Object.keys(week.completions ?? {}).length, 0);
  const historicalBest = history.reduce<ProgressReport["bestWeek"]>((best, week) => {
    const count = Object.keys(week.completions ?? {}).length;
    return !best || count > best.completedCount ? { weekKey: week.weekKey, completedCount: count } : best;
  }, null);
  const bestWeek = completedEntries.length > (historicalBest?.completedCount ?? 0)
    ? { weekKey: "current", completedCount: completedEntries.length }
    : historicalBest;
  const completionPct = entries.length ? Math.round((completedEntries.length / entries.length) * 100) : 0;
  let guidance = "Choose one session to complete today. Small wins make the week.";
  if (completionPct >= 80) guidance = "Your consistency is doing the heavy lifting. Keep the rhythm kind and steady.";
  else if (completionPct >= 50) guidance = "More than halfway there. Protect the next session before adding more volume.";
  else if (completedEntries.length > 0) guidance = "A real start is on the board. One more completed session builds momentum.";
  return {
    plannedCount: entries.length,
    completedCount: completedEntries.length,
    plannedMinutes,
    completedMinutes,
    consistencyPct: completionPct,
    currentStreak,
    bestWeek,
    totalCompletedSessions: historicalCompleted + completedEntries.length,
    completedGroups,
    guidance,
  };
}

export function adaptiveGuidance(plan: Record<string, Session>, completions: CompletionMap): string {
  const completed = Object.entries(completions).filter(([slot]) => !!plan[slot]);
  const notes = completed.map(([, entry]) => entry.note?.toLowerCase() ?? "").join(" ");
  const averageEffort = completed.reduce((sum, [, entry]) => sum + (entry.effort ?? 3), 0) / Math.max(1, completed.length);
  if (/too much|sore|exhausted|hard/.test(notes) || averageEffort >= 4.5) return "The work is landing hard. Keep the next week steady and leave room for recovery.";
  if (completed.length >= 3) return "Your rhythm is taking shape. Repeat the sessions that felt good before adding more.";
  return "Start with consistency. A few completed sessions give your next plan better information.";
}

export function currentWeekKey(date = new Date()): string {
  // ISO week number
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Progressive-overload advice comparing this week to the previous. */
export function overloadCheck(
  thisWeek: Session[],
  history: WeekRecord[],
): { insights: OverloadInsight[]; headline: string } {
  const prev = history[history.length - 2] ?? history[0];
  if (!prev) {
    return {
      insights: [],
      headline: "First week on record — everything from here is a PR.",
    };
  }
  const sum = (sessions: Session[], focus: string) =>
    sessions.filter((s) => s.focus === focus).reduce((t, s) => t + s.minutes, 0);

  const groups = new Set([
    ...thisWeek.map((s) => s.focus),
    ...prev.sessions.map((s) => s.focus),
  ]);

  const insights: OverloadInsight[] = [];
  for (const g of groups) {
    const last = sum(prev.sessions, g);
    const now = sum(thisWeek, g);
    const base = last || 1;
    const deltaPct = Math.round(((now - last) / base) * 100);
    let advice: string;
    if (now === 0) advice = `Dropped entirely this week. Pick it back up next week.`;
    else if (deltaPct > 40) advice = `Big jump (+${deltaPct}%). Great — just watch the joints.`;
    else if (deltaPct > 0) advice = `Up ${deltaPct}% on last week. Textbook progression.`;
    else if (deltaPct === 0) advice = `Same as last week. Ready to nudge it up?`;
    else advice = `Down ${Math.abs(deltaPct)}%. Deload or drift?`;
    insights.push({ focus: g, lastWeekMinutes: last, thisWeekMinutes: now, deltaPct, advice });
  }

  const up = insights.filter((i) => i.deltaPct > 0).length;
  const headline =
    insights.length === 0
      ? "No history yet."
      : up === insights.length
        ? "Everything is trending up. The graph loves you."
        : up > insights.length / 2
          ? "Mostly climbing. Momentum is real."
          : "Mixed signals — one more focused week fixes it.";

  return { insights, headline };
}

/** Personal records: best streak of planned weeks, biggest session ever. */
export function personalRecords(history: WeekRecord[], currentSessions: Session[]) {
  let longestStreak = history.length; // consecutive recorded weeks
  let biggest = currentSessions[0] ?? null;
  for (const w of [...history.map((h) => h.sessions), currentSessions]) {
    for (const s of w) {
      if (!biggest || s.minutes > biggest.minutes) biggest = s;
    }
  }
  const totalAllTime =
    history.reduce((t, w) => t + w.sessions.length, 0) + currentSessions.length;
  return {
    weeksTracked: history.length + 1,
    longestStreak,
    totalSessionsAllTime: totalAllTime,
    biggestSession: biggest ? { title: biggest.title, minutes: biggest.minutes } : null,
  };
}
