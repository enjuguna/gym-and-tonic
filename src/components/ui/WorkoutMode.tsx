import { useEffect, useRef, useState } from "react";
import { exerciseById } from "../../lib/coach";
import { sound } from "../../lib/sound";
import { usePlan } from "../../lib/store";
import type { Session } from "../../lib/types";

function formatTime(milliseconds: number) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function WorkoutMode({ session, onClose, onFinished }: { session: Session; onClose: () => void; onFinished: () => void }) {
  const workout = usePlan((s) => s.activeWorkout);
  const alerts = usePlan((s) => s.workoutAlerts);
  const setStep = usePlan((s) => s.setWorkoutStep);
  const goToStep = usePlan((s) => s.goToWorkoutStep);
  const startTimer = usePlan((s) => s.startWorkoutTimer);
  const toggleTimer = usePlan((s) => s.toggleWorkoutTimer);
  const finishTimer = usePlan((s) => s.finishWorkoutTimer);
  const skipRest = usePlan((s) => s.skipWorkoutRest);
  const adjustRest = usePlan((s) => s.adjustWorkoutRest);
  const finishWorkout = usePlan((s) => s.finishWorkout);
  const setAlerts = usePlan((s) => s.setWorkoutAlerts);
  const [now, setNow] = useState(Date.now());
  const [showSteps, setShowSteps] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const alertedTimer = useRef<number | null>(null);

  useEffect(() => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    headingRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setConfirmExit(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  const timer = workout?.timer;
  const remainingMs = timer?.status === "running" ? Math.max(0, (timer.endsAt ?? now) - now) : (timer?.remainingMs ?? 0);
  useEffect(() => {
    if (!timer || timer.status !== "running" || remainingMs > 0 || alertedTimer.current === timer.endsAt) return;
    alertedTimer.current = timer.endsAt ?? null;
    finishTimer();
    if (alerts.sound) sound.alert();
    if (alerts.vibration) navigator.vibrate?.([80, 50, 120]);
  }, [alerts.sound, alerts.vibration, finishTimer, remainingMs, timer]);

  useEffect(() => {
    if (timer?.status !== "running" || !("wakeLock" in navigator)) return;
    let sentinel: { release: () => Promise<void> } | undefined;
    void (navigator as Navigator & { wakeLock?: { request: (type: "screen") => Promise<typeof sentinel> } }).wakeLock?.request("screen").then((value) => { sentinel = value; }).catch(() => undefined);
    return () => { void sentinel?.release(); };
  }, [timer?.status]);

  const currentIndex = workout?.currentExerciseIndex ?? 0;
  const currentStep = workout?.steps[currentIndex];
  const exercise = currentStep ? exerciseById(currentStep.exerciseId) : undefined;
  const unfinished = workout?.steps.filter((step) => step.status === "pending").length ?? 0;
  const completed = workout?.steps.filter((step) => step.status === "completed").length ?? 0;
  const isRest = timer?.kind === "rest" && workout?.phase !== "paused";
  const timerFinished = timer?.status === "finished";
  const actionLabel = currentStep?.status === "completed" ? "Completed" : currentStep?.status === "skipped" ? "Skipped" : "Mark exercise done";

  const requestFinish = () => {
    if (unfinished > 0) setConfirmFinish(true);
    else if (finishWorkout()) onFinished();
  };
  const closeAndRestoreFocus = () => {
    onClose();
    requestAnimationFrame(() => returnFocusRef.current?.focus());
  };

  if (!workout || !currentStep || !exercise) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-[#26251f] text-[#f7f5ef]" role="dialog" aria-modal="true" aria-labelledby="workout-heading">
      <div className="mx-auto flex min-h-full max-w-3xl flex-col px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-8">
        <header className="flex items-center justify-between gap-4 border-b border-white/15 pb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">Guided workout</p>
            <h2 ref={headingRef} id="workout-heading" tabIndex={-1} className="mt-1 font-serif text-xl font-semibold outline-none">{session.title}</h2>
          </div>
          <button onClick={() => setConfirmExit(true)} className="min-h-11 rounded-full border border-white/20 px-4 text-xs font-bold text-white hover:bg-white/10">Pause & exit</button>
        </header>

        <main className="flex flex-1 flex-col py-8 sm:py-12">
          <div className="flex items-center justify-between text-xs text-stone-300">
            <span>Exercise {currentIndex + 1} of {workout.steps.length}</span>
            <span>{completed} done · {unfinished} to go</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15" aria-label={`${completed} of ${workout.steps.length} exercises completed`} role="progressbar" aria-valuemin={0} aria-valuemax={workout.steps.length} aria-valuenow={completed}>
            <div className="h-full rounded-full bg-emerald-400 transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${(completed / Math.max(1, workout.steps.length)) * 100}%` }} />
          </div>

          {isRest ? (
            <section className="my-auto py-12 text-center" aria-live="polite">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300">Rest with purpose</p>
              <p className="mt-4 font-serif text-7xl font-semibold tracking-tight sm:text-8xl">{formatTime(remainingMs)}</p>
              <p className="mx-auto mt-5 max-w-sm text-sm leading-relaxed text-stone-300">Breathe, sip some water, then return to {exercise.name} with intent.</p>
              <div className="mt-7 flex flex-wrap justify-center gap-2">
                <button onClick={() => adjustRest(-15)} className="min-h-11 rounded-full border border-white/20 px-4 text-xs font-bold hover:bg-white/10">−15 sec</button>
                <button onClick={timerFinished ? skipRest : toggleTimer} className="min-h-11 rounded-full bg-emerald-400 px-5 text-xs font-bold text-[#173015] hover:bg-emerald-300">{timerFinished ? "Continue" : timer?.status === "paused" ? "Resume rest" : "Pause timer"}</button>
                <button onClick={() => adjustRest(15)} className="min-h-11 rounded-full border border-white/20 px-4 text-xs font-bold hover:bg-white/10">+15 sec</button>
              </div>
              <button onClick={skipRest} className="mt-5 text-xs font-semibold text-stone-300 underline underline-offset-4 hover:text-white">Skip rest</button>
            </section>
          ) : (
            <section className="my-auto py-8 sm:py-12">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300">Right now</p>
              <h3 className="mt-3 max-w-2xl font-serif text-5xl font-semibold leading-[0.95] tracking-tight sm:text-7xl">{exercise.name}</h3>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-stone-200">{exercise.cues}</p>
              <div className="mt-7 flex flex-wrap gap-2 text-xs text-stone-200">
                <span className="rounded-full border border-white/15 px-3 py-1.5">{exercise.duration} min guide</span>
                {exercise.equipment.length ? exercise.equipment.map((item) => <span key={item} className="rounded-full border border-white/15 px-3 py-1.5">{item}</span>) : <span className="rounded-full border border-white/15 px-3 py-1.5">No equipment</span>}
              </div>
              <div className="mt-10 rounded-3xl border border-white/15 bg-white/[0.06] p-5 sm:p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-300">Exercise timer</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
                  <p className="font-serif text-5xl font-semibold tabular-nums">{timer?.kind === "exercise" ? formatTime(remainingMs) : `${exercise.duration}:00`}</p>
                  {timer?.kind === "exercise" && timerFinished ? <span className="rounded-full bg-emerald-400/20 px-3 py-1.5 text-xs font-bold text-emerald-200">Timer finished — your call.</span> : <button onClick={timer?.kind === "exercise" ? toggleTimer : startTimer} className="min-h-11 rounded-full bg-white px-5 text-xs font-bold text-[#26251f] hover:bg-stone-100">{timer?.kind === "exercise" && timer?.status === "paused" ? "Resume timer" : timer?.kind === "exercise" ? "Pause timer" : "Start timer"}</button>}
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button disabled={currentStep.status !== "pending"} onClick={() => setStep(currentIndex, "completed")} className="min-h-12 rounded-full bg-emerald-400 px-6 text-sm font-bold text-[#173015] disabled:cursor-default disabled:opacity-60">{actionLabel}</button>
                {currentStep.status === "pending" && <button onClick={() => setStep(currentIndex, "skipped")} className="min-h-12 rounded-full border border-white/25 px-5 text-sm font-bold hover:bg-white/10">Skip exercise</button>}
                <button onClick={requestFinish} className="min-h-12 rounded-full border border-white/25 px-5 text-sm font-bold hover:bg-white/10">Finish workout</button>
              </div>
            </section>
          )}

          <section className="border-t border-white/15 pt-5">
            <button onClick={() => setShowSteps((value) => !value)} aria-expanded={showSteps} className="text-xs font-bold text-emerald-200 underline underline-offset-4">{showSteps ? "Hide exercise list" : "View all exercises"}</button>
            {showSteps && <ol className="mt-4 grid gap-2 sm:grid-cols-2">{workout.steps.map((step, index) => {
              const item = exerciseById(step.exerciseId);
              return <li key={`${step.exerciseId}-${index}`}><button onClick={() => goToStep(index)} aria-current={index === currentIndex ? "step" : undefined} className={`flex min-h-11 w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-xs ${index === currentIndex ? "border-emerald-300 bg-emerald-300/10" : "border-white/15 hover:bg-white/10"}`}><span>{index + 1}. {item?.name ?? step.exerciseId}</span><span className="ml-3 font-bold text-emerald-200">{step.status === "completed" ? "Done" : step.status === "skipped" ? "Skipped" : "Open"}</span></button></li>;
            })}</ol>}
          </section>
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-4 text-xs text-stone-300">
          <label className="flex items-center gap-2"><input type="checkbox" checked={alerts.sound} onChange={(event) => setAlerts({ sound: event.target.checked })} /> Sound alerts</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={alerts.vibration} onChange={(event) => setAlerts({ vibration: event.target.checked })} /> Vibration alerts</label>
        </footer>
      </div>

      {confirmFinish && <ConfirmDialog title="Finish before every exercise is done?" detail={`${unfinished} exercise${unfinished === 1 ? " is" : "s are"} still open. You can record this workout now, or keep going.`} confirmLabel="Finish workout" onCancel={() => setConfirmFinish(false)} onConfirm={() => { if (finishWorkout()) onFinished(); }} />}
      {confirmExit && <ConfirmDialog title="Pause this workout?" detail="Your exercise progress and any active timer will be ready when you come back." confirmLabel="Keep it ready" onCancel={() => setConfirmExit(false)} onConfirm={closeAndRestoreFocus} />}
    </div>
  );
}

function ConfirmDialog({ title, detail, confirmLabel, onCancel, onConfirm }: { title: string; detail: string; confirmLabel: string; onCancel: () => void; onConfirm: () => void }) {
  return <div className="fixed inset-0 z-10 grid place-items-center bg-black/55 p-5" role="alertdialog" aria-modal="true" aria-labelledby="workout-confirm-heading"><div className="w-full max-w-sm rounded-3xl bg-[#f7f5ef] p-6 text-[#26251f] shadow-2xl"><h3 id="workout-confirm-heading" className="font-serif text-2xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-relaxed text-stone-600">{detail}</p><div className="mt-6 flex flex-wrap gap-3"><button autoFocus onClick={onConfirm} className="button-primary">{confirmLabel}</button><button onClick={onCancel} className="button-secondary">Keep going</button></div></div></div>;
}
