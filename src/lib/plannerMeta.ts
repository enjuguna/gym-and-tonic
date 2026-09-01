import type { MuscleGroup } from "./types";

export const GROUPS = ["legs", "push", "pull", "core", "cardio", "mobility"] as const satisfies readonly MuscleGroup[];
export const FOCUS_META: Record<MuscleGroup, { icon: string; chip: string }> = {
  legs: { icon: "🦵", chip: "bg-orange-100 text-orange-800" },
  push: { icon: "💪", chip: "bg-sky-100 text-sky-800" },
  pull: { icon: "🪢", chip: "bg-violet-100 text-violet-800" },
  core: { icon: "🎯", chip: "bg-lime-100 text-lime-800" },
  cardio: { icon: "❤️", chip: "bg-rose-100 text-rose-800" },
  mobility: { icon: "🧘", chip: "bg-teal-100 text-teal-800" },
};

export function weekPhase(count: number): string {
  if (count < 7) return "A fresh little start";
  if (count < 13) return "Momentum week — build like a lion.";
  return "Finisher mode";
}
