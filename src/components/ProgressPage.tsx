import { useMemo, useState } from "react";
import { usePlan } from "../lib/store";
import { currentWeekKey, loadHistory, progressReport } from "../lib/history";
import { loadTracking, kgForDisplay, kgFromDisplay, localDateKey, saveTracking, type TrackingRecord } from "../lib/tracking";

function weekDates() {
  const today = new Date();
  const monday = new Date(today);
  monday.setHours(12, 0, 0, 0);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => { const date = new Date(monday); date.setDate(monday.getDate() + i); return localDateKey(date); });
}

function weekKeyForDate(value: string) { return currentWeekKey(new Date(`${value}T12:00:00`)); }

function recentWeeks() {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return Array.from({ length: 12 }, (_, i) => { const week = new Date(date); week.setDate(date.getDate() - (11 - i) * 7); return currentWeekKey(week); });
}

export default function ProgressPage() {
  const plan = usePlan((state) => state.plan);
  const completions = usePlan((state) => state.completions);
  const [tracking, setTracking] = useState<TrackingRecord>(() => loadTracking());
  const [weight, setWeight] = useState("");
  const [target, setTarget] = useState(tracking.targetWeightKg ? kgForDisplay(tracking.targetWeightKg, tracking.weightUnit).toFixed(1) : "");
  const [date, setDate] = useState(localDateKey());
  const [editing, setEditing] = useState<string | null>(null);
  const report = useMemo(() => progressReport(plan, completions, loadHistory()), [plan, completions]);
  const dates = weekDates();
  const walking = dates.reduce((sum, day) => sum + (tracking.walking[day] ?? 0), 0);
  const habits = dates.reduce((sum, day) => sum + Object.values(tracking.habitChecks[day] ?? {}).filter(Boolean).length, 0);
  const entries = Object.values(tracking.weightEntries).sort((a, b) => b.date.localeCompare(a.date));
  const update = (next: TrackingRecord) => { if (saveTracking(next)) setTracking(next); };
  const saveTarget = () => { const value = Number(target); if (Number.isFinite(value) && value > 0) update({ ...tracking, targetWeightKg: kgFromDisplay(value, tracking.weightUnit) }); else if (!target.trim()) { const next = { ...tracking }; delete next.targetWeightKg; update(next); } };
  const saveWeight = () => { const value = Number(weight); if (!Number.isFinite(value) || value <= 0) return; update({ ...tracking, weightEntries: { ...tracking.weightEntries, [date]: { date, kg: kgFromDisplay(value, tracking.weightUnit) } } }); setWeight(""); setEditing(null); };
  const editWeight = (entry: { date: string; kg: number }) => { setEditing(entry.date); setDate(entry.date); setWeight(kgForDisplay(entry.kg, tracking.weightUnit).toFixed(1)); };
  const removeWeight = (entryDate: string) => { const next = { ...tracking.weightEntries }; delete next[entryDate]; update({ ...tracking, weightEntries: next }); };
  const weeks = recentWeeks();
  const averages = weeks.map((week) => { const values = entries.filter((entry) => weekKeyForDate(entry.date) === week).map((entry) => entry.kg); return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null; });
  const maxWeight = Math.max(...entries.map((entry) => entry.kg), 1);
  const targetPct = tracking.targetWeightKg ? Math.max(0, Math.min(100, tracking.targetWeightKg / maxWeight * 100)) : undefined;

  return <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
    <section className="surface-card p-6">
      <p className="eyebrow text-[var(--sage)]">This week · {currentWeekKey()}</p>
      <h2 className="mt-1 font-display text-3xl font-semibold">Progress you can see.</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Completed workouts and extra walking stay separate, so the picture remains honest.</p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric label="Workouts" value={`${report.completedCount}/${report.plannedCount}`} /><Metric label="Minutes done" value={`${report.completedMinutes}/${report.plannedMinutes}`} /><Metric label="Walking this week" value={`${walking} min`} /><Metric label="Habits this week" value={`${habits}`} /></div>
      <div className="mt-6 rounded-2xl bg-[var(--paper)] p-5"><p className="text-sm font-semibold">{report.guidance}</p><p className="mt-1 text-xs text-[var(--muted)]">Active-week streak: {report.currentStreak}. All-time completed: {report.totalCompletedSessions}.</p><a className="button-secondary mt-4 inline-block" href="/plan">Review your plan</a></div>
    </section>
    <section className="surface-card p-6">
      <div className="flex items-start justify-between gap-3"><div><p className="eyebrow text-[var(--terra)]">Optional and private</p><h2 className="mt-1 font-display text-2xl font-semibold">Weight trend</h2></div><button className="button-secondary min-h-11 px-3 text-xs" onClick={() => update({ ...tracking, weightEnabled: !tracking.weightEnabled })}>{tracking.weightEnabled ? "Hide" : "Show"}</button></div>
      {tracking.weightEnabled ? <div>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Dated records for your reference. No predictions or targets are required.</p>
        <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto_auto]"><input aria-label={`Weight in ${tracking.weightUnit}`} className="rounded-xl border border-stone-200 px-3 py-3" type="number" min="1" step="0.1" placeholder={`Weight (${tracking.weightUnit})`} value={weight} onChange={(event) => setWeight(event.target.value)} /><input aria-label="Weight date" className="rounded-xl border border-stone-200 px-3 py-3" type="date" value={date} onChange={(event) => setDate(event.target.value)} /><button className="button-primary min-h-11" onClick={saveWeight}>{editing ? "Update" : "Save"}</button></div>
        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]"><label className="text-xs font-semibold text-stone-600">Optional target<input aria-label={`Target weight in ${tracking.weightUnit}`} className="mt-1 min-h-11 w-full rounded-xl border border-stone-200 px-3 py-2 font-normal" type="number" min="1" step="0.1" value={target} placeholder={`Target (${tracking.weightUnit})`} onChange={(event) => setTarget(event.target.value)} /></label><button className="button-secondary mt-5 min-h-11" onClick={saveTarget}>Save target</button></div>
        <div className="mt-5 grid gap-2">{entries.slice(0, 12).map((entry) => <div key={entry.date} className="flex items-center justify-between rounded-xl border border-stone-200 px-3 py-2 text-sm"><span>{entry.date}</span><span className="flex items-center gap-3"><strong>{kgForDisplay(entry.kg, tracking.weightUnit).toFixed(1)} {tracking.weightUnit}</strong><button aria-label={`Edit weight entry for ${entry.date}`} className="text-xs underline" onClick={() => editWeight(entry)}>Edit</button><button aria-label={`Delete weight entry for ${entry.date}`} className="text-xs text-red-700 underline" onClick={() => removeWeight(entry.date)}>Delete</button></span></div>)}{!entries.length && <p className="text-sm text-[var(--muted)]">No entries yet. Add one when it is useful to you.</p>}</div>
        <div className="mt-6" aria-label="12 week weight averages"><p className="text-xs font-bold uppercase tracking-wider text-stone-500">12-week view</p><div className="relative mt-3 grid h-28 grid-cols-12 items-end gap-1">{targetPct !== undefined && <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-amber-600" style={{ bottom: `${targetPct}%` }} aria-label="Optional target reference line" />}{averages.map((value, index) => <div key={`${weeks[index]}-${index}`} className="flex h-full items-end" title={value === null ? "No entry" : `${kgForDisplay(value, tracking.weightUnit).toFixed(1)} ${tracking.weightUnit} average`}><div className={`w-full rounded-t bg-[var(--sage)] ${value === null ? "h-1 opacity-20" : "min-h-2"}`} style={value === null ? undefined : { height: `${Math.max(10, Math.min(100, value / maxWeight * 100))}%` }} /></div>)}</div><p className="mt-2 text-xs text-[var(--muted)]">Empty weeks are intentionally left blank. Neutral reference data, no predictions.</p></div>
      </div> : <div className="mt-6 rounded-2xl bg-[var(--paper)] p-5 text-sm text-[var(--muted)]">Weight tracking is off. You can turn it on when you want a private record.</div>}
    </section>
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-stone-200 bg-white p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">{label}</p><p className="mt-1 font-display text-xl font-semibold text-emerald-900">{value}</p></div>; }
