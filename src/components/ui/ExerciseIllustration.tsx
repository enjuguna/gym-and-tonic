import { EXERCISE_VISUALS } from "../../lib/exerciseVisuals";

export function ExerciseIllustration({ exerciseId }: { exerciseId: string }) {
  const visual = EXERCISE_VISUALS[exerciseId];
  if (!visual || !visual.reviewed) return null;
  return <div className="mt-6 flex items-center gap-4" role="img" aria-label={visual.label}><svg viewBox="0 0 120 72" className="h-20 w-32 rounded-2xl border border-white/15 bg-white/[0.06] p-2" aria-hidden="true"><circle cx="61" cy="14" r="7" fill={visual.accent} /><path d="M61 23 L61 45 M61 29 L42 38 M61 29 L80 36 M61 45 L45 62 M61 45 L78 60" fill="none" stroke={visual.accent} strokeLinecap="round" strokeWidth="5" /><path d="M32 64h57" stroke="white" strokeLinecap="round" strokeOpacity=".35" strokeWidth="2" /></svg><p className="max-w-xs text-xs leading-5 text-stone-400">Visual guide only. Follow the written cue and choose the easier option if needed.</p></div>;
}
