import { beforeEach, describe, expect, it } from "vitest";
import { loadPersistedPlan, usePlan } from "./store";
import type { Session } from "./types";

const session = (id: string, focus: Session["focus"] = "legs"): Session => ({
  id, title: id, focus, intensity: "moderate", minutes: 30, exercises: [],
});

beforeEach(() => {
  localStorage.clear();
  usePlan.setState({ plan: {}, proposals: [], activityLog: [], preferences: { duration: "30to45", equipment: "gym", intensity: "moderate" }, hasStarted: false, setupDismissed: false });
});

describe("proposal application", () => {
  it("rejects a pending proposal and records the rejection", () => {
    const id = usePlan.getState().applyProposal({ summary: "test", toolSource: "agent", payload: { kind: "place", slot: "0-am", session: session("a") } });
    usePlan.getState().rejectProposal(id);
    expect(usePlan.getState().proposals[0].state).toBe("undone");
    expect(usePlan.getState().plan).toEqual({});
    expect(usePlan.getState().activityLog.at(-1)?.kind).toBe("reject");
  });

  it("applies both sides of a swap", () => {
    usePlan.getState().placeSession("0-am", session("a"));
    usePlan.getState().placeSession("1-pm", session("b", "push"));
    const id = usePlan.getState().applyProposal({ summary: "swap", toolSource: "agent", payload: { kind: "swap", slotA: "0-am", slotB: "1-pm", sessionA: session("a"), sessionB: session("b", "push") } });
    usePlan.getState().approveProposal(id);
    expect(usePlan.getState().plan["0-am"].id).toBe("b");
    expect(usePlan.getState().plan["1-pm"].id).toBe("a");
  });

  it("uses the exact sessions staged by fill-week", () => {
    const fills = [{ slot: "0-pm" as const, session: session("exact", "cardio") }];
    const id = usePlan.getState().applyProposal({ summary: "fill", toolSource: "agent", payload: { kind: "fill-week", fills } });
    usePlan.getState().approveProposal(id);
    expect(usePlan.getState().plan["0-pm"]).toEqual(fills[0].session);
  });

  it("makes repeated approval and rejection no-ops", () => {
    const id = usePlan.getState().applyProposal({ summary: "test", toolSource: "agent", payload: { kind: "place", slot: "0-am", session: session("a") } });
    usePlan.getState().approveProposal(id);
    usePlan.getState().approveProposal(id);
    expect(usePlan.getState().plan["0-am"].id).toBe("a");
    usePlan.getState().rejectProposal(id);
    expect(usePlan.getState().proposals[0].state).toBe("approved");
  });

  it("persists the active plan in a versioned storage record", () => {
    usePlan.getState().placeSession("0-am", session("persisted"));
    const saved = JSON.parse(localStorage.getItem("gt_plan")!);
    expect(saved.version).toBe(1);
    expect(saved.plan["0-am"].id).toBe("persisted");
  });

  it("falls back safely for malformed persisted data", () => {
    localStorage.setItem("gt_plan", "not-json");
    expect(loadPersistedPlan()).toEqual({
      plan: {},
      preferences: { duration: "30to45", equipment: "gym", intensity: "moderate" },
      hasStarted: false,
      setupDismissed: false,
    });
  });
});
