import { create } from "zustand";
import type { Session } from "./types";
import { generateSession } from "./coach";

export type Slot = `${number}-${"am" | "pm"}`; // "0-am" .. "6-pm"
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const MEALS = ["am", "pm"] as const;

interface PlanState {
  /** slot key -> session; 14 slots like sundaytable's meal grid */
  plan: Record<string, Session>;
  proposals: Proposal[];
  preferences: {
    under30: boolean;
    noLegDayExcuses: boolean;
    homeWorkout: boolean;
    sweatIsFine: boolean;
  };

  activityLog: ActivityEntry[];

  placeSession: (slot: Slot, session: Session, by?: "player" | "agent") => void;
  clearSlot: (slot: Slot) => void;
  setPreference: (k: keyof PlanState["preferences"], v: boolean) => void;

  applyProposal: (p: { kind: string; summary: string; toolSource: string; payload: unknown }) => string;
  approveProposal: (id: string) => void;
  undoProposal: (id: string) => void;
}

export interface Proposal {
  id: string;
  kind: "place" | "clear" | "fill-week";
  summary: string;
  payload: unknown;
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

const logSeq = { n: 0 };

function logActivity(s: { activityLog: ActivityEntry[] }, e: Omit<ActivityEntry, "id" | "at">): ActivityEntry[] {
  return [...s.activityLog.slice(-9), { id: ++logSeq.n, at: Date.now(), ...e }];
}

export const usePlan = create<PlanState>((set) => ({
  plan: {},
  proposals: [],
  activityLog: [],
  preferences: { under30: false, noLegDayExcuses: true, homeWorkout: false, sweatIsFine: true },

  placeSession: (slot, session, by = "player") =>
    set((s) => ({
      plan: { ...s.plan, [slot]: session },
      activityLog: logActivity(s, { kind: "place", focus: session.focus, by }),
    })),

  clearSlot: (slot) =>
    set((s) => {
      const plan = { ...s.plan };
      delete plan[slot];
      return { plan, activityLog: logActivity(s, { kind: "clear", by: "player" }) };
    }),

  setPreference: (k, v) => set((s) => ({ preferences: { ...s.preferences, [k]: v } })),

  applyProposal: ({ kind, summary, toolSource, payload }) => {
    const id = `prop-${++seq}`;
    set((s) => ({
      proposals: [{ id, kind: kind as Proposal["kind"], summary, payload, toolSource, state: "pending", createdAt: Date.now() }, ...s.proposals],
    }));
    return id;
  },

  approveProposal: (pid) =>
    set((s) => {
      const p = s.proposals.find((x) => x.id === pid);
      if (!p || p.state !== "pending") return s;
      let next: typeof s = s;
      if (p.kind === "place") {
        const { slot, session } = p.payload as { slot: Slot; session: Session };
        next = { ...s, plan: { ...s.plan, [slot]: session } };
      } else if (p.kind === "clear") {
        const { slot } = p.payload as { slot: Slot };
        const plan = { ...s.plan };
        delete plan[slot];
        next = { ...s, plan };
      } else if (p.kind === "fill-week") {
        const filled = { ...s.plan };
        for (const d of [0, 1, 2, 3, 4]) {
          const key = `${d}-pm` as Slot;
          if (!filled[key]) filled[key] = generateSession("moderate" in (p.payload as object) ? ((p.payload as any).focus ?? "push") : "push");
        }
        next = { ...s, plan: filled };
      }
      return {
        ...next,
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
      if (p.kind === "place") {
        const { slot } = p.payload as { slot: Slot };
        const plan = { ...s.plan };
        delete plan[slot];
        next = { ...s, plan };
      }
      return { ...next, proposals: s.proposals.map((x) => (x.id === pid ? { ...x, state: "undone" as const } : x)) };
    }),
}));
