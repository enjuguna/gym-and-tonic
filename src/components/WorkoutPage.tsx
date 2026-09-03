import { useEffect, useRef } from "react";
import { usePlan } from "../lib/store";
import { WorkoutMode } from "./ui/WorkoutMode";
import type { Slot } from "../lib/types";

export default function WorkoutPage() {
  const workout = usePlan((s) => s.activeWorkout);
  const startWorkout = usePlan((s) => s.startWorkout);
  const requested = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search).get("slot");
  const requestedSlot = requested && /^\d-(?:am|pm)$/.test(requested) ? requested as Slot : null;
  const requestStarted = useRef(false);
  useEffect(() => { if (!requestStarted.current && !workout && requestedSlot) { requestStarted.current = true; startWorkout(requestedSlot); } }, [requestedSlot, startWorkout, workout]);
  const session = workout ? usePlan.getState().plan[workout.slot] : undefined;
  if (!workout || !session) return <main className="grid min-h-screen place-items-center bg-[var(--paper)] p-6"><section className="surface-card max-w-md p-7"><p className="eyebrow text-[var(--sage)]">No active workout</p><h1 className="mt-2 font-display text-3xl font-semibold">Choose a session to begin.</h1><a href="/today" className="button-primary mt-6 inline-block">Back to Today</a></section></main>;
  return <WorkoutMode session={session} onClose={() => { window.location.href = "/today"; }} onFinished={() => { window.setTimeout(() => { window.location.href = `/today?reflect=${encodeURIComponent(workout.slot)}`; }, 20); }} />;
}
