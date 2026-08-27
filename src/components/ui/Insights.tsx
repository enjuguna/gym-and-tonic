import { useMemo } from "react";
import { usePlan } from "../../lib/store";
import { balanceCheck } from "../../lib/coach";
import { loadHistory, overloadCheck } from "../../lib/history";

/** Analytics panel: volume per group + week-over-week overload insights. */
export function Insights() {
  const plan = usePlan((s) => s.plan);
  const sessions = useMemo(() => Object.values(plan), [plan]);
  const balance = useMemo(() => balanceCheck(sessions), [sessions]);
  const maxMinutes = Math.max(1, ...Object.values(balance.perGroup));

  const history = useMemo(() => loadHistory(), [plan]);
  const overload = useMemo(() => overloadCheck(sessions, history), [sessions, history]);

  return (
    <section className="mt-10 grid gap-4 lg:grid-cols-2">
      {/* volume per group */}
      <details open className="surface-card group p-5">
        <summary className="cursor-pointer list-none pr-6 marker:hidden"><p className="eyebrow text-stone-400">This week's load <span className="float-right text-xs text-stone-400 group-open:hidden">Show +</span></p><h3 className="mt-0.5 font-serif text-xl">Minutes by muscle group.</h3></summary>
        <div className="mt-4 space-y-2.5">
          {Object.entries(balance.perGroup).length === 0 && (
            <p className="text-sm text-stone-400">Nothing planned yet — the chart is waiting.</p>
          )}
          {Object.entries(balance.perGroup)
            .sort((a, b) => b[1] - a[1])
            .map(([g, mins]) => (
              <div key={g}>
                <div className="flex justify-between text-xs text-stone-500">
                  <span className="font-medium capitalize">{g}</span>
                  <span className="tabular-nums">{mins} min</span>
                </div>
                <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-stone-100">
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all duration-700"
                    style={{ width: `${(mins / maxMinutes) * 100}%` }}
                  />
                </div>
              </div>
            ))}
        </div>
      </details>

      {/* overload insights */}
      <details open className="surface-card group p-5">
        <summary className="cursor-pointer list-none pr-6 marker:hidden"><p className="eyebrow text-stone-400">Week over week <span className="float-right text-xs text-stone-400 group-open:hidden">Show +</span></p><h3 className="mt-0.5 font-serif text-xl">{overload.headline}</h3></summary>
        <p className="mt-1 text-[11px] text-stone-400">
          Week over week
          {history.length >= 2 && (
            <span className="ml-2 rounded bg-stone-100 px-1.5 py-0.5 normal-case text-stone-400">
              vs {history[history.length - 2].weekKey}
            </span>
          )}
        </p>
        {overload.insights.length === 0 ? (
          <p className="mt-3 text-sm text-stone-400">
            Complete this week and it gets archived automatically — next week the coach can compare against it.
          </p>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {overload.insights.map((i) => {
              const tone =
                i.thisWeekMinutes === 0
                  ? "bg-stone-100 text-stone-500"
                  : i.deltaPct > 0
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-amber-50 text-amber-800";
              return (
                <li key={i.focus} className={`rounded-lg px-3 py-2 text-sm ${tone}`}>
                  <span className="font-semibold capitalize">{i.focus}</span>{" "}
                  <span className="tabular-nums opacity-70">
                    ({i.lastWeekMinutes}→{i.thisWeekMinutes} min)
                  </span>
                  <br />
                  <span className="text-xs italic">{i.advice}</span>
                </li>
              );
            })}
          </ul>
        )}
      </details>
    </section>
  );
}
