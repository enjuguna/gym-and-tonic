import { create } from "zustand";
import type { ActiveWorkout, CompletionEntry, CompletionMap, Session, SetupPreferences, Slot, WorkoutAlertPreferences, WorkoutStepStatus, WorkoutTimer } from "./types";
import { currentWeekKey, saveWeek } from "./history";
import { isTrackingRecord, loadTracking, sanitizeTrackingRecord, type TrackingRecord } from "./tracking";
import { exerciseById } from "./coach";
import { track } from "./analytics";

export type { Slot } from "./types";
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const MEALS = ["am", "pm"] as const;

export interface PlaceProposalPayload { kind: "place"; slot: Slot; session: Session }
export interface ClearProposalPayload { kind: "clear"; slot: Slot; session?: Session }
export interface SwapProposalPayload {
  kind: "swap";
  slotA: Slot;
  slotB: Slot;
  sessionA: Session;
  sessionB: Session;
}
export interface FillWeekProposalPayload {
  kind: "fill-week";
  fills: Array<{ slot: Slot; session: Session }>;
}
export type ProposalPayload =
  | PlaceProposalPayload
  | ClearProposalPayload
  | SwapProposalPayload
  | FillWeekProposalPayload;
export type ProposalKind = ProposalPayload["kind"];
export interface ProposalDraft {
  summary: string;
  toolSource: string;
  payload: ProposalPayload;
}

interface PlanState {
  /** slot key -> session; 14 slots like sundaytable's meal grid */
  plan: Record<string, Session>;
  proposals: Proposal[];
  preferences: SetupPreferences;
  hasStarted: boolean;
  setupDismissed: boolean;
  completions: CompletionMap;
  reviewing: boolean;
  activeWorkout: ActiveWorkout | null;
  workoutAlerts: WorkoutAlertPreferences;

  activityLog: ActivityEntry[];

  placeSession: (slot: Slot, session: Session, by?: "player" | "agent") => void;
  replacePlanContent: (plan: Record<string, Session>) => void;
  clearSlot: (slot: Slot) => void;
  setPreference: <K extends keyof PlanState["preferences"]>(k: K, v: PlanState["preferences"][K]) => void;
  dismissSetup: () => void;
  completeSession: (slot: Slot, input?: Omit<CompletionEntry, "completedAt">) => boolean;
  uncompleteSession: (slot: Slot) => boolean;
  updateCompletion: (slot: Slot, input: Omit<CompletionEntry, "completedAt">) => boolean;
  startNextWeek: () => void;
  reviewWeek: () => void;
  startWorkout: (slot: Slot) => boolean;
  setWorkoutStep: (index: number, status: Exclude<WorkoutStepStatus, "pending">) => void;
  goToWorkoutStep: (index: number) => void;
  startWorkoutTimer: () => void;
  toggleWorkoutTimer: () => void;
  finishWorkoutTimer: () => void;
  skipWorkoutRest: () => void;
  adjustWorkoutRest: (seconds: number) => void;
  finishWorkout: () => boolean;
  abandonWorkout: () => void;
  setWorkoutAlerts: (alerts: Partial<WorkoutAlertPreferences>) => void;

  applyProposal: (p: ProposalDraft) => string;
  approveProposal: (id: string) => void;
  rejectProposal: (id: string) => void;
  undoProposal: (id: string) => void;
}

export interface Proposal {
  id: string;
  kind: ProposalKind;
  summary: string;
  payload: ProposalPayload;
  toolSource: string;
  state: "pending" | "approved" | "undone";
  createdAt: number;
}

export interface ActivityEntry {
  id: number;
  kind: "place" | "clear" | "approve" | "reject" | "swap" | "connect" | "complete" | "uncomplete" | "note" | "review" | "workout-start" | "workout-abandon";
  focus?: string;
  by: "player" | "agent" | "system";
  detail?: string;
  at: number;
}

let seq = 0;

export const PLAN_STORAGE_KEY = "gt_plan";
const PLAN_STORAGE_VERSION = 4;

interface PersistedPlan {
  version: number;
  plan: Record<string, Session>;
  preferences: SetupPreferences;
  hasStarted: boolean;
  setupDismissed: boolean;
  completions?: CompletionMap;
  activeWorkout?: ActiveWorkout | null;
  workoutAlerts?: WorkoutAlertPreferences;
}

export interface PlannerBackup extends PersistedPlan {
  exportedAt: number;
  format: "gym-tonic-plan";
  tracking?: TrackingRecord;
}

const DEFAULT_PREFERENCES: SetupPreferences = { duration: "30to45", equipment: "gym", intensity: "moderate" };
const DEFAULT_WORKOUT_ALERTS: WorkoutAlertPreferences = { sound: false, vibration: false };

function isSession(value: unknown): value is Session {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<Session>;
  return typeof session.id === "string" && typeof session.title === "string" &&
    session.id.length > 0 && session.title.length > 0 &&
    typeof session.minutes === "number" && Number.isFinite(session.minutes) && session.minutes > 0 &&
    Array.isArray(session.exercises) && session.exercises.every((id) => typeof id === "string" && id.length > 0) &&
    ["legs", "push", "pull", "core", "cardio", "mobility"].includes(session.focus ?? "") &&
    ["light", "moderate", "brutal"].includes(session.intensity ?? "") &&
    (session.refuel === undefined || typeof session.refuel === "string") &&
    (session.refuelDetail === undefined || (typeof session.refuelDetail === "object" && session.refuelDetail !== null && typeof session.refuelDetail.id === "string" && typeof session.refuelDetail.title === "string" && typeof session.refuelDetail.plate === "string" && typeof session.refuelDetail.reason === "string" && Array.isArray(session.refuelDetail.tags)));
}

function isPlan(value: unknown): value is Record<string, Session> {
  return !!value && typeof value === "object" && Object.entries(value).every(([slot, session]) => /^(?:[0-6])-(?:am|pm)$/.test(slot) && isSession(session));
}

function isPreferences(value: unknown): value is SetupPreferences {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<SetupPreferences>;
  return ["under30", "30to45", "45plus"].includes(p.duration ?? "") && ["home", "gym"].includes(p.equipment ?? "") && ["light", "moderate", "brutal"].includes(p.intensity ?? "") &&
    (p.goal === undefined || ["weight-loss", "general-fitness", "build-strength"].includes(p.goal)) &&
    (p.experience === undefined || ["beginner", "returning", "regular"].includes(p.experience)) &&
    (p.dietaryPreference === undefined || ["omnivore", "vegetarian", "vegan", "pescatarian"].includes(p.dietaryPreference)) &&
    (p.weightUnit === undefined || ["kg", "lb"].includes(p.weightUnit));
}

function sanitizeCompletions(value: unknown, plan: Record<string, Session>): CompletionMap {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(Object.entries(value).flatMap(([slot, entry]) => {
    if (!plan[slot] || !entry || typeof entry !== "object" || typeof (entry as CompletionEntry).completedAt !== "number") return [];
    const candidate = entry as CompletionEntry;
    const effort = [1, 2, 3, 4, 5].includes(candidate.effort ?? 0) ? candidate.effort : undefined;
    return [[slot, { completedAt: candidate.completedAt, ...(typeof candidate.note === "string" ? { note: candidate.note.slice(0, 500) } : {}), ...(effort ? { effort } : {}) }]];
  })) as CompletionMap;
}

function restoreActiveWorkout(raw: unknown, plan: Record<string, Session>): ActiveWorkout | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Partial<ActiveWorkout>;
  const session = typeof candidate.slot === "string" ? plan[candidate.slot] : undefined;
  if (!session || candidate.sessionId !== session.id || !Array.isArray(candidate.steps)) return null;
  const statuses = candidate.steps.map((step) =>
    step && typeof step === "object" && (step as { status?: string }).status === "completed"
      ? "completed"
      : step && typeof step === "object" && (step as { status?: string }).status === "skipped"
        ? "skipped"
        : "pending",
  );
  if (statuses.length !== session.exercises.length) return null;
  const rawTimer = candidate.timer;
  const validTimer = rawTimer && typeof rawTimer === "object" &&
    ((rawTimer as WorkoutTimer).kind === "exercise" || (rawTimer as WorkoutTimer).kind === "rest") &&
    (["running", "paused", "finished"] as const).includes((rawTimer as WorkoutTimer).status);
  return {
    slot: candidate.slot as Slot,
    sessionId: session.id,
    startedAt: typeof candidate.startedAt === "number" ? candidate.startedAt : Date.now(),
    currentExerciseIndex: Math.max(0, Math.min(session.exercises.length - 1, Number(candidate.currentExerciseIndex) || 0)),
    phase: candidate.phase === "rest" || candidate.phase === "paused" ? candidate.phase : "exercise",
    steps: session.exercises.map((exerciseId, index) => ({ exerciseId, status: statuses[index] })),
    timer: validTimer ? {
      kind: (rawTimer as WorkoutTimer).kind,
      status: (rawTimer as WorkoutTimer).status,
      endsAt: typeof (rawTimer as WorkoutTimer).endsAt === "number" ? (rawTimer as WorkoutTimer).endsAt : undefined,
      remainingMs: typeof (rawTimer as WorkoutTimer).remainingMs === "number" ? (rawTimer as WorkoutTimer).remainingMs : undefined,
    } : undefined,
  };
}

export function loadPersistedPlan(): Pick<PlanState, "plan" | "preferences" | "hasStarted" | "setupDismissed" | "completions" | "reviewing" | "activeWorkout" | "workoutAlerts"> {
  const defaults = { plan: {}, preferences: DEFAULT_PREFERENCES, hasStarted: false, setupDismissed: false, completions: {}, reviewing: false, activeWorkout: null, workoutAlerts: DEFAULT_WORKOUT_ALERTS };
  if (typeof window === "undefined") return defaults;
  try {
    const raw = JSON.parse(window.localStorage.getItem(PLAN_STORAGE_KEY) ?? "null") as Partial<PersistedPlan> | null;
    if (!raw || !isPlan(raw.plan) || ![1, 2, 3, PLAN_STORAGE_VERSION].includes(raw.version ?? 0) || (raw.version === PLAN_STORAGE_VERSION && !isPreferences(raw.preferences))) return defaults;
    const plan = raw.plan;
    const storedVersion = raw.version ?? 0;
    return {
      plan,
      preferences: isPreferences(raw.preferences) ? { ...defaults.preferences, ...raw.preferences } : defaults.preferences,
      hasStarted: !!raw.hasStarted || Object.keys(plan).length > 0,
      setupDismissed: !!raw.setupDismissed,
      completions: storedVersion === 1 ? {} : sanitizeCompletions(raw.completions, plan),
      reviewing: false,
      activeWorkout: storedVersion >= 3 ? restoreActiveWorkout(raw.activeWorkout, plan) : null,
      workoutAlerts: storedVersion >= 3 ? { ...DEFAULT_WORKOUT_ALERTS, ...raw.workoutAlerts } : DEFAULT_WORKOUT_ALERTS,
    };
  } catch {
    return defaults;
  }
}

function persistPlan(state: Pick<PlanState, "plan" | "preferences" | "hasStarted" | "setupDismissed" | "completions" | "activeWorkout" | "workoutAlerts">) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify({ version: PLAN_STORAGE_VERSION, plan: state.plan, preferences: state.preferences, hasStarted: state.hasStarted, setupDismissed: state.setupDismissed, completions: state.completions, activeWorkout: state.activeWorkout, workoutAlerts: state.workoutAlerts }));
  } catch { /* private mode or storage quota */ }
}

export function exportPlannerBackup(): string {
  const state = usePlan.getState();
  const backup: PlannerBackup = {
    format: "gym-tonic-plan",
    exportedAt: Date.now(),
    version: PLAN_STORAGE_VERSION,
    plan: state.plan,
    preferences: state.preferences,
    hasStarted: state.hasStarted,
    setupDismissed: state.setupDismissed,
    completions: state.completions,
    activeWorkout: state.activeWorkout,
    workoutAlerts: state.workoutAlerts,
    tracking: loadTracking(),
  };
  return JSON.stringify(backup, null, 2);
}

export function importPlannerBackup(input: string): boolean {
  try {
    const raw = JSON.parse(input) as Partial<PlannerBackup>;
    if (raw.format !== "gym-tonic-plan" || raw.version !== PLAN_STORAGE_VERSION || !isPlan(raw.plan) || !isPreferences(raw.preferences)) return false;
    if (raw.tracking !== undefined && !isTrackingRecord(raw.tracking)) return false;
    const plan = raw.plan;
    usePlan.setState({
      plan,
      preferences: raw.preferences,
      hasStarted: !!raw.hasStarted || Object.keys(plan).length > 0,
      setupDismissed: !!raw.setupDismissed,
      completions: sanitizeCompletions(raw.completions, plan),
      activeWorkout: restoreActiveWorkout(raw.activeWorkout, plan),
      workoutAlerts: { ...DEFAULT_WORKOUT_ALERTS, ...raw.workoutAlerts },
      proposals: [],
      reviewing: false,
      activityLog: [],
    });
    if (raw.tracking) {
      const tracking = sanitizeTrackingRecord(raw.tracking);
      localStorage.setItem("gt_tracking", JSON.stringify(tracking));
    }
    track("plan_imported");
    return true;
  } catch { return false; }
}

export function resetPlannerData() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("gt_history");
    window.localStorage.removeItem("gt_templates");
    window.localStorage.removeItem("gt_tracking");
  }
  usePlan.setState({ plan: {}, preferences: DEFAULT_PREFERENCES, hasStarted: false, setupDismissed: false, completions: {}, reviewing: false, activeWorkout: null, workoutAlerts: DEFAULT_WORKOUT_ALERTS, proposals: [], activityLog: [] });
  if (typeof window !== "undefined") window.localStorage.removeItem(PLAN_STORAGE_KEY);
}

const logSeq = { n: 0 };

function logActivity(s: { activityLog: ActivityEntry[] }, e: Omit<ActivityEntry, "id" | "at">): ActivityEntry[] {
  return [...s.activityLog.slice(-9), { id: ++logSeq.n, at: Date.now(), ...e }];
}

export const usePlan = create<PlanState>((set, get) => ({
  ...loadPersistedPlan(),
  proposals: [],
  activityLog: [],

  placeSession: (slot, session, by = "player") =>
    set((s) => {
      const completions = { ...s.completions };
      delete completions[slot];
      if (Object.keys(s.plan).length === 0) track("first_session_placed");
      return { plan: { ...s.plan, [slot]: session }, completions, activeWorkout: s.activeWorkout?.slot === slot ? null : s.activeWorkout, hasStarted: true, activityLog: logActivity(s, { kind: "place", focus: session.focus, by }) };
    }),

  replacePlanContent: (plan) => set((s) => {
    const current = { ...s, plan };
    persistPlan(current);
    return { plan };
  }),

  clearSlot: (slot) =>
    set((s) => {
      const plan = { ...s.plan };
      delete plan[slot];
      const completions = { ...s.completions };
      delete completions[slot];
      return { plan, completions, activeWorkout: s.activeWorkout?.slot === slot ? null : s.activeWorkout, activityLog: logActivity(s, { kind: "clear", by: "player" }) };
    }),

  setPreference: (k, v) => set((s) => ({ preferences: { ...s.preferences, [k]: v } })),
  dismissSetup: () => set({ setupDismissed: true }),

  completeSession: (slot, input = {}) => {
    const current = get();
    if (!current.plan[slot] || current.completions[slot]) return false;
    set((s) => ({ completions: { ...s.completions, [slot]: { ...input, completedAt: Date.now() } }, activityLog: logActivity(s, { kind: "complete", focus: s.plan[slot].focus, by: "player" }) }));
    return true;
  },

  uncompleteSession: (slot) => {
    if (!get().completions[slot]) return false;
    set((s) => { const completions = { ...s.completions }; delete completions[slot]; return { completions, activityLog: logActivity(s, { kind: "uncomplete", by: "player" }) }; });
    return true;
  },

  updateCompletion: (slot, input) => {
    if (!get().completions[slot]) return false;
    set((s) => ({ completions: { ...s.completions, [slot]: { ...s.completions[slot], ...input } }, activityLog: logActivity(s, { kind: "note", by: "player" }) }));
    return true;
  },

  startNextWeek: () => set((s) => {
    const sessions = Object.values(s.plan);
    if (sessions.length) {
      const completedMinutes = Object.entries(s.plan).reduce((total, [slot, session]) => total + (s.completions[slot as Slot] ? session.minutes : 0), 0);
      saveWeek(currentWeekKey(), sessions, s.completions, completedMinutes);
    }
    return { plan: {}, completions: {}, proposals: [], activeWorkout: null, hasStarted: false, setupDismissed: false, reviewing: false, activityLog: logActivity(s, { kind: "review", by: "player", detail: "Started a new week" }) };
  }),

  reviewWeek: () => set((s) => ({ reviewing: true, activityLog: logActivity(s, { kind: "review", by: "player" }) })),

  startWorkout: (slot) => {
    const current = get();
    const session = current.plan[slot];
    if (!session || current.completions[slot]) return false;
    if (current.activeWorkout) return current.activeWorkout.slot === slot && current.activeWorkout.sessionId === session.id;
    const activeWorkout: ActiveWorkout = { slot, sessionId: session.id, startedAt: Date.now(), currentExerciseIndex: 0, phase: "exercise", steps: session.exercises.map((exerciseId) => ({ exerciseId, status: "pending" })) };
    set((s) => ({
      activeWorkout,
      activityLog: logActivity(s, { kind: "workout-start", focus: session.focus, by: "player", detail: session.title }),
    }));
    // Persist immediately so direct navigation to /workout cannot outrun the
    // store subscription during a browser unload.
    persistPlan({ ...current, activeWorkout });
    track("workout_started");
    return true;
  },

  setWorkoutStep: (index, status) => set((s) => {
    const workout = s.activeWorkout;
    if (!workout || !workout.steps[index]) return s;
    const steps = workout.steps.map((step, stepIndex) => stepIndex === index ? { ...step, status } : step);
    const nextPending = steps.findIndex((step, stepIndex) => stepIndex > index && step.status === "pending");
    const session = s.plan[workout.slot];
    const restSeconds = session?.intensity === "brutal" ? 90 : session?.intensity === "light" ? 45 : 60;
    const hasNext = nextPending >= 0;
    return {
      activeWorkout: {
        ...workout,
        steps,
        currentExerciseIndex: hasNext ? nextPending : index,
        phase: hasNext ? "rest" : "exercise",
        timer: hasNext ? { kind: "rest", status: "running", endsAt: Date.now() + restSeconds * 1000 } : undefined,
      },
    };
  }),

  goToWorkoutStep: (index) => set((s) => {
    const workout = s.activeWorkout;
    if (!workout || !workout.steps[index]) return s;
    return { activeWorkout: { ...workout, currentExerciseIndex: index, phase: "exercise", timer: undefined } };
  }),

  startWorkoutTimer: () => set((s) => {
    const workout = s.activeWorkout;
    const session = workout && s.plan[workout.slot];
    const exerciseId = workout?.steps[workout.currentExerciseIndex]?.exerciseId;
    if (!workout || !session || !exerciseId) return s;
    const minutes = exerciseById(exerciseId)?.duration ?? Math.max(1, session.minutes / Math.max(1, session.exercises.length));
    return { activeWorkout: { ...workout, phase: "exercise", timer: { kind: "exercise", status: "running", endsAt: Date.now() + Math.round(minutes * 60_000) } } };
  }),

  toggleWorkoutTimer: () => set((s) => {
    const workout = s.activeWorkout;
    const timer = workout?.timer;
    if (!workout || !timer || timer.status === "finished") return s;
    if (timer.status === "running") {
      const remainingMs = Math.max(0, (timer.endsAt ?? Date.now()) - Date.now());
      return { activeWorkout: { ...workout, phase: "paused", timer: { ...timer, status: "paused", remainingMs, endsAt: undefined } } };
    }
    const remainingMs = timer.remainingMs ?? 0;
    return { activeWorkout: { ...workout, phase: timer.kind === "rest" ? "rest" : "exercise", timer: { ...timer, status: "running", endsAt: Date.now() + remainingMs, remainingMs: undefined } } };
  }),

  finishWorkoutTimer: () => set((s) => {
    const workout = s.activeWorkout;
    const timer = workout?.timer;
    if (!workout || !timer || timer.status !== "running") return s;
    return { activeWorkout: { ...workout, phase: timer.kind === "rest" ? "rest" : "exercise", timer: { ...timer, status: "finished", endsAt: undefined, remainingMs: 0 } } };
  }),

  skipWorkoutRest: () => set((s) => {
    const workout = s.activeWorkout;
    if (!workout || workout.timer?.kind !== "rest") return s;
    return { activeWorkout: { ...workout, phase: "exercise", timer: undefined } };
  }),

  adjustWorkoutRest: (seconds) => set((s) => {
    const workout = s.activeWorkout;
    const timer = workout?.timer;
    if (!workout || !timer || timer.kind !== "rest") return s;
    const now = Date.now();
    const currentMs = timer.status === "running" ? Math.max(0, (timer.endsAt ?? now) - now) : (timer.remainingMs ?? 0);
    const nextMs = Math.max(15_000, Math.min(300_000, currentMs + seconds * 1000));
    return { activeWorkout: { ...workout, timer: timer.status === "running" ? { ...timer, endsAt: now + nextMs } : { ...timer, remainingMs: nextMs } } };
  }),

  finishWorkout: () => {
    const current = get();
    const workout = current.activeWorkout;
    const session = workout && current.plan[workout.slot];
    if (!workout || !session || session.id !== workout.sessionId || current.completions[workout.slot]) return false;
    const completions = { ...current.completions, [workout.slot]: { completedAt: Date.now() } };
    set((s) => ({
      completions,
      activeWorkout: null,
      activityLog: logActivity(s, { kind: "complete", focus: session.focus, by: "player", detail: `Finished workout: ${session.title}` }),
    }));
    persistPlan({ ...current, completions, activeWorkout: null });
    track("workout_finished");
    return true;
  },

  abandonWorkout: () => set((s) => s.activeWorkout ? ({ activeWorkout: null, activityLog: logActivity(s, { kind: "workout-abandon", by: "player" }) }) : s),

  setWorkoutAlerts: (alerts) => set((s) => ({ workoutAlerts: { ...s.workoutAlerts, ...alerts } })),

  applyProposal: ({ summary, toolSource, payload }) => {
    const id = `prop-${++seq}`;
    set((s) => ({
      proposals: [{ id, kind: payload.kind, summary, payload, toolSource, state: "pending", createdAt: Date.now() }, ...s.proposals],
    }));
    return id;
  },

  approveProposal: (pid) =>
    set((s) => {
      const p = s.proposals.find((x) => x.id === pid);
      if (!p || p.state !== "pending") return s;
      let next: typeof s = s;
      if (p.payload.kind === "place") {
        const { slot, session } = p.payload;
        const completions = { ...s.completions }; delete completions[slot];
        next = { ...s, plan: { ...s.plan, [slot]: session }, completions, activeWorkout: s.activeWorkout?.slot === slot ? null : s.activeWorkout };
      } else if (p.payload.kind === "clear") {
        const { slot } = p.payload;
        const plan = { ...s.plan };
        delete plan[slot];
        const completions = { ...s.completions }; delete completions[slot];
        next = { ...s, plan, completions, activeWorkout: s.activeWorkout?.slot === slot ? null : s.activeWorkout };
      } else if (p.payload.kind === "swap") {
        const { slotA, slotB, sessionA, sessionB } = p.payload;
        next = { ...s, plan: { ...s.plan, [slotA]: sessionB, [slotB]: sessionA }, completions: { ...s.completions, [slotA]: s.completions[slotB], [slotB]: s.completions[slotA] } };
      } else if (p.payload.kind === "fill-week") {
        const filled = { ...s.plan };
        for (const { slot, session } of p.payload.fills) if (!filled[slot]) filled[slot] = session;
        next = { ...s, plan: filled };
      }
      return {
        ...next,
        hasStarted: true,
        proposals: s.proposals.map((x) => (x.id === pid ? { ...x, state: "approved" as const } : x)),
        activityLog: logActivity(s, {
          kind: p.toolSource !== "manual" ? "approve" : "approve",
          by: p.toolSource !== "manual" ? "agent" : "player",
          detail: p.summary,
        }),
      };
    }),

  undoProposal: (pid) =>
    set((s) => {
      const p = s.proposals.find((x) => x.id === pid);
      if (!p || p.state !== "approved") return s;
      let next = s;
      if (p.payload.kind === "place") {
        const { slot } = p.payload;
        const plan = { ...s.plan };
        delete plan[slot];
        next = { ...s, plan };
      } else if (p.payload.kind === "clear" && p.payload.session) {
        next = { ...s, plan: { ...s.plan, [p.payload.slot]: p.payload.session } };
      } else if (p.payload.kind === "swap") {
        next = { ...s, plan: { ...s.plan, [p.payload.slotA]: p.payload.sessionA, [p.payload.slotB]: p.payload.sessionB } };
      } else if (p.payload.kind === "fill-week") {
        const plan = { ...s.plan };
        for (const { slot, session } of p.payload.fills) {
          if (plan[slot]?.id === session.id) delete plan[slot];
        }
        next = { ...s, plan };
      }
      return { ...next, proposals: s.proposals.map((x) => (x.id === pid ? { ...x, state: "undone" as const } : x)) };
    }),

  rejectProposal: (pid) =>
    set((s) => {
      const p = s.proposals.find((x) => x.id === pid);
      if (!p || p.state !== "pending") return s;
      return {
        proposals: s.proposals.map((x) => (x.id === pid ? { ...x, state: "undone" as const } : x)),
        activityLog: logActivity(s, { kind: "reject", by: p.toolSource !== "manual" ? "agent" : "player", detail: p.summary }),
      };
    }),
}));

usePlan.subscribe((state) => persistPlan(state));
