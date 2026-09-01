import { useMemo } from "react";
import { usePlan } from "../../lib/store";
import { loadHistory, progressReport } from "../../lib/history";

interface Props { onReview: () => void; onNextWeek: () => void; }

export function ProgressDashboard({ onReview, onNextWeek }: Props) {
  const plan = usePlan((s) => s.plan);
  const completions = usePlan((s) => s.completions);
  const reviewing = usePlan((s) => s.reviewing);
  const report = useMemo(() => progressReport(plan, completions, loadHistory()), [plan, completions]);
  const hasWork = report.plannedCount > 0;
  const history = useMemo(() => loadHistory().slice(-4).reverse(), [report.completedCount, reviewing]);
  return (
    <section className="surface-card mt-8 overflow-hidden" aria-labelledby="progress-heading">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] px-5 py-4 sm:px-6">
        <div><p className="eyebrow text-emerald-700">{reviewing ? "Week in review" : "The good work"}</p><h2 id="progress-heading" className="mt-1 font-serif text-2xl font-semibold">Progress, not perfection.</h2><p className="mt-1 text-sm text-stone-500">{report.guidance}</p></div>
        <div className="flex gap-2"><button onClick={onReview} className="button-secondary">{reviewing ? "Reviewed ✓" : "Review this week"}</button>{hasWork && <button onClick={onNextWeek} className="button-quiet">Start next week</button>}</div>
      </div>
      <div className="grid grid-cols-2 gap-px bg-[var(--line)] sm:grid-cols-6">
        <Metric label="Completed" value={`${report.completedCount}/${report.plannedCount}`} />
        <Metric label="Minutes done" value={`${report.completedMinutes}`} suffix={`/${report.plannedMinutes}`} />
        <Metric label="Consistency" value={`${report.consistencyPct}%`} />
        <Metric label="Current streak" value={`${report.currentStreak}`} suffix="sessions" />
        <Metric label="All-time total" value={`${report.totalCompletedSessions}`} suffix="sessions" />
        <Metric label="Best week" value={report.bestWeek ? `${report.bestWeek.completedCount}` : "—"} suffix={report.bestWeek?.weekKey} />
      </div>
      {report.completedGroups.length > 0 && <div className="flex flex-wrap items-center gap-2 px-5 py-3 text-xs text-stone-500 sm:px-6"><span className="font-semibold text-stone-600">Completed coverage</span>{report.completedGroups.map((group) => <span key={group} className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium capitalize text-emerald-800">{group}</span>)}</div>}
      <div className="border-t border-[var(--line)] px-5 py-4 sm:px-6" aria-label="Recent training history"><p className="eyebrow text-stone-400">Recent rhythm</p>{history.length ? <div className="mt-3 grid gap-2 sm:grid-cols-4">{history.map((week) => <div key={week.weekKey} className="rounded-xl bg-[var(--paper)] px-3 py-2"><p className="text-xs font-semibold">{week.weekKey}</p><p className="mt-1 text-[11px] text-stone-500">{week.completedCount ?? Object.keys(week.completions ?? {}).length} completed · {week.completedMinutes ?? 0} min</p></div>)}</div> : <p className="mt-2 text-xs text-stone-500">Complete or archive a week and its rhythm will appear here.</p>}</div>
    </section>
  );
}

function Metric({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return <div className="bg-white px-4 py-3 sm:px-5"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">{label}</p><p className="mt-1 font-serif text-xl font-semibold text-emerald-900">{value} <span className="font-sans text-[10px] font-normal text-stone-400">{suffix}</span></p></div>;
}
