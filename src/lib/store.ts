import { create } from "zustand";
import type { Session, SetupPreferences, Slot } from "./types";

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

  activityLog: ActivityEntry[];

  placeSession: (slot: Slot, session: Session, by?: "player" | "agent") => void;
  clearSlot: (slot: Slot) => void;
  setPreference: <K extends keyof PlanState["preferences"]>(k: K, v: PlanState["preferences"][K]) => void;
  dismissSetup: () => void;

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
  kind: "place" | "clear" | "approve" | "reject" | "swap" | "connect";
  focus?: string;
  by: "player" | "agent" | "system";
  detail?: string;
  at: number;
}

let seq = 0;

const PLAN_STORAGE_KEY = "gt_plan";
const PLAN_STORAGE_VERSION = 1;

interface PersistedPlan {
  version: number;
  plan: Record<string, Session>;
  preferences: SetupPreferences;
  hasStarted: boolean;
  setupDismissed: boolean;
}

const DEFAULT_PREFERENCES: SetupPreferences = { duration: "30to45", equipment: "gym", intensity: "moderate" };

export function loadPersistedPlan(): Pick<PlanState, "plan" | "preferences" | "hasStarted" | "setupDismissed"> {
  const defaults = { plan: {}, preferences: DEFAULT_PREFERENCES, hasStarted: false, setupDismissed: false };
  if (typeof window === "undefined") return defaults;
  try {
    const raw = JSON.parse(window.localStorage.getItem(PLAN_STORAGE_KEY) ?? "null") as Partial<PersistedPlan> | null;
    if (raw?.version !== PLAN_STORAGE_VERSION || !raw.plan || !raw.preferences) return defaults;
    return { plan: raw.plan, preferences: { ...defaults.preferences, ...raw.preferences }, hasStarted: !!raw.hasStarted || Object.keys(raw.plan).length > 0, setupDismissed: !!raw.setupDismissed };
  } catch {
    return defaults;
  }
}

function persistPlan(state: Pick<PlanState, "plan" | "preferences" | "hasStarted" | "setupDismissed">) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify({ version: PLAN_STORAGE_VERSION, plan: state.plan, preferences: state.preferences, hasStarted: state.hasStarted, setupDismissed: state.setupDismissed }));
  } catch { /* private mode or storage quota */ }
}

const logSeq = { n: 0 };

function logActivity(s: { activityLog: ActivityEntry[] }, e: Omit<ActivityEntry, "id" | "at">): ActivityEntry[] {
  return [...s.activityLog.slice(-9), { id: ++logSeq.n, at: Date.now(), ...e }];
}

export const usePlan = create<PlanState>((set) => ({
  ...loadPersistedPlan(),
  proposals: [],
  activityLog: [],

  placeSession: (slot, session, by = "player") =>
    set((s) => ({
      plan: { ...s.plan, [slot]: session },
      hasStarted: true,
      activityLog: logActivity(s, { kind: "place", focus: session.focus, by }),
    })),

  clearSlot: (slot) =>
    set((s) => {
      const plan = { ...s.plan };
      delete plan[slot];
      return { plan, activityLog: logActivity(s, { kind: "clear", by: "player" }) };
    }),

  setPreference: (k, v) => set((s) => ({ preferences: { ...s.preferences, [k]: v } })),
  dismissSetup: () => set({ setupDismissed: true }),

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
        next = { ...s, plan: { ...s.plan, [slot]: session } };
      } else if (p.payload.kind === "clear") {
        const { slot } = p.payload;
        const plan = { ...s.plan };
        delete plan[slot];
        next = { ...s, plan };
      } else if (p.payload.kind === "swap") {
        const { slotA, slotB, sessionA, sessionB } = p.payload;
        next = { ...s, plan: { ...s.plan, [slotA]: sessionB, [slotB]: sessionA } };
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
