import { usePlan } from "../../lib/store";
import type { EquipmentPreference, Intensity, WorkoutDuration } from "../../lib/types";

interface Props {
  onStart: () => void;
  onFillWeek: () => void;
  onAskCoach: () => void;
}

const choiceClass = (selected: boolean) =>
  `rounded-xl border px-3 py-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${
    selected ? "border-emerald-700 bg-emerald-50 text-emerald-900 shadow-sm" : "border-stone-200 bg-white text-stone-600 hover:border-emerald-600/50 hover:bg-emerald-50/40"
  }`;

export function SetupPanel({ onStart, onFillWeek, onAskCoach }: Props) {
  const preferences = usePlan((s) => s.preferences);
  const setPreference = usePlan((s) => s.setPreference);
  const dismissSetup = usePlan((s) => s.dismissSetup);

  return (
    <section className="surface-card mb-8 overflow-hidden" aria-labelledby="setup-heading">
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_1.35fr] lg:items-center">
        <div>
          <p className="eyebrow text-emerald-700">Start small</p>
          <h2 id="setup-heading" className="mt-1 font-serif text-2xl font-semibold tracking-tight sm:text-3xl">Let’s put one good session on the board.</h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-stone-600">A few quick choices help your coach make the first suggestion feel like yours. You can change everything later.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={onStart} className="button-primary">Add my first session <span aria-hidden="true">→</span></button>
            <button onClick={onAskCoach} className="button-secondary">Ask my coach</button>
            <button onClick={dismissSetup} className="button-quiet">I’ll browse first</button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <ChoiceGroup label="Session length">
            {([ ["under30", "Under 30m"], ["30to45", "30–45m"], ["45plus", "45m+"] ] as const).map(([value, label]) => (
              <button key={value} onClick={() => setPreference("duration", value)} aria-pressed={preferences.duration === value} className={choiceClass(preferences.duration === value)}>{label}</button>
            ))}
          </ChoiceGroup>
          <ChoiceGroup label="Where you train">
            {([ ["home", "At home"], ["gym", "At the gym"] ] as const).map(([value, label]) => (
              <button key={value} onClick={() => setPreference("equipment", value)} aria-pressed={preferences.equipment === value} className={choiceClass(preferences.equipment === value)}>{label}</button>
            ))}
          </ChoiceGroup>
          <ChoiceGroup label="Effort today">
            {([ ["light", "Easy does it"], ["moderate", "Proper work"], ["brutal", "Bring it"] ] as const).map(([value, label]) => (
              <button key={value} onClick={() => setPreference("intensity", value)} aria-pressed={preferences.intensity === value} className={choiceClass(preferences.intensity === value)}>{label}</button>
            ))}
          </ChoiceGroup>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] bg-[var(--paper)]/60 px-5 py-3 text-xs text-stone-500 sm:px-6">
        <span>Prefer a ready-made rhythm?</span>
        <button onClick={onFillWeek} className="font-semibold text-emerald-800 underline-offset-2 hover:underline">Fill weekday evenings →</button>
      </div>
    </section>
  );
}

function ChoiceGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return <fieldset className="grid content-start gap-2"><legend className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">{label}</legend><div className="grid gap-1.5">{children}</div></fieldset>;
}

export type { EquipmentPreference, Intensity, WorkoutDuration };
