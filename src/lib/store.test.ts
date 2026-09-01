import { beforeEach, describe, expect, it } from "vitest";
import { exportPlannerBackup, importPlannerBackup, loadPersistedPlan, resetPlannerData, usePlan } from "./store";
import type { Session } from "./types";

const session = (id: string, focus: Session["focus"] = "legs"): Session => ({
  id, title: id, focus, intensity: "moderate", minutes: 30, exercises: [],
});

beforeEach(() => {
  localStorage.clear();
  usePlan.setState({ plan: {}, proposals: [], activityLog: [], preferences: { duration: "30to45", equipment: "gym", intensity: "moderate" }, hasStarted: false, setupDismissed: false, completions: {}, reviewing: false, activeWorkout: null, workoutAlerts: { sound: false, vibration: false } });
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
    expect(saved.version).toBe(3);
    expect(saved.plan["0-am"].id).toBe("persisted");
  });

  it("completes, reflects on, and uncompletes a session", () => {
    usePlan.getState().placeSession("0-am", session("tracked"));
    expect(usePlan.getState().completeSession("0-am")).toBe(true);
    expect(usePlan.getState().completions["0-am"]?.completedAt).toBeTypeOf("number");
    expect(usePlan.getState().updateCompletion("0-am", { note: "Felt strong", effort: 4 })).toBe(true);
    expect(usePlan.getState().completions["0-am"]?.note).toBe("Felt strong");
    expect(usePlan.getState().uncompleteSession("0-am")).toBe(true);
    expect(usePlan.getState().completions["0-am"]).toBeUndefined();
  });

  it("migrates a version-one plan without carrying stale completion data", () => {
    localStorage.setItem("gt_plan", JSON.stringify({ version: 1, plan: { "0-am": session("old") }, preferences: { under30: true } }));
    const migrated = loadPersistedPlan();
    expect(migrated.plan["0-am"].id).toBe("old");
    expect(migrated.completions).toEqual({});
    expect(migrated.preferences.duration).toBe("30to45");
  });

  it("falls back safely for malformed persisted data", () => {
    localStorage.setItem("gt_plan", "not-json");
    expect(loadPersistedPlan()).toEqual({
      plan: {},
      preferences: { duration: "30to45", equipment: "gym", intensity: "moderate" },
      hasStarted: false,
      setupDismissed: false,
      completions: {},
      reviewing: false,
      activeWorkout: null,
      workoutAlerts: { sound: false, vibration: false },
    });
  });

  it("exports and restores a validated local backup", () => {
    usePlan.getState().placeSession("0-am", session("portable"));
    usePlan.getState().completeSession("0-am", { note: "Good work" });
    const backup = exportPlannerBackup();
    usePlan.setState({ plan: {}, completions: {} });
    expect(importPlannerBackup(backup)).toBe(true);
    expect(usePlan.getState().plan["0-am"]?.id).toBe("portable");
    expect(usePlan.getState().completions["0-am"]?.note).toBe("Good work");
    expect(importPlannerBackup('{"format":"gym-tonic-plan"}')).toBe(false);
  });

  it("only removes local planner data after the explicit reset action", () => {
    usePlan.getState().placeSession("0-am", session("remove"));
    localStorage.setItem("gt_history", "history");
    resetPlannerData();
    expect(usePlan.getState().plan).toEqual({});
    expect(localStorage.getItem("gt_plan")).toBeNull();
    expect(localStorage.getItem("gt_history")).toBeNull();
  });

  it("starts a workout only for an incomplete planned session and resumes it", () => {
    expect(usePlan.getState().startWorkout("0-am")).toBe(false);
    usePlan.getState().placeSession("0-am", { ...session("guided"), exercises: ["ex-squat", "ex-lunge"] });
    expect(usePlan.getState().startWorkout("0-am")).toBe(true);
    expect(usePlan.getState().activeWorkout?.steps).toHaveLength(2);
    expect(usePlan.getState().startWorkout("0-am")).toBe(true);
    expect(usePlan.getState().activityLog.filter((event) => event.kind === "workout-start")).toHaveLength(1);
  });

  it("tracks steps, starts a rest timer, and never silently completes the session", () => {
    usePlan.getState().placeSession("0-am", { ...session("guided"), exercises: ["ex-squat", "ex-lunge"] });
    usePlan.getState().startWorkout("0-am");
    usePlan.getState().setWorkoutStep(0, "completed");
    expect(usePlan.getState().activeWorkout?.steps[0].status).toBe("completed");
    expect(usePlan.getState().activeWorkout?.timer?.kind).toBe("rest");
    usePlan.getState().finishWorkoutTimer();
    expect(usePlan.getState().completions["0-am"]).toBeUndefined();
  });

  it("finishes a workout explicitly and clears only its active state", () => {
    usePlan.getState().placeSession("0-am", { ...session("guided"), exercises: ["ex-squat"] });
    usePlan.getState().startWorkout("0-am");
    expect(usePlan.getState().finishWorkout()).toBe(true);
    expect(usePlan.getState().completions["0-am"]).toBeTruthy();
    expect(usePlan.getState().activeWorkout).toBeNull();
  });

  it("clears active workout state when its session is replaced or cleared", () => {
    usePlan.getState().placeSession("0-am", session("first"));
    usePlan.getState().startWorkout("0-am");
    usePlan.getState().placeSession("0-am", session("replacement"));
    expect(usePlan.getState().activeWorkout).toBeNull();
    usePlan.getState().startWorkout("0-am");
    usePlan.getState().clearSlot("0-am");
    expect(usePlan.getState().activeWorkout).toBeNull();
  });

  it("migrates a version-two record and rejects an outdated active workout", () => {
    localStorage.setItem("gt_plan", JSON.stringify({ version: 2, plan: { "0-am": session("v2") }, preferences: { duration: "30to45", equipment: "gym", intensity: "moderate" }, completions: {} }));
    expect(loadPersistedPlan().plan["0-am"].id).toBe("v2");
    localStorage.setItem("gt_plan", JSON.stringify({ version: 3, plan: { "0-am": session("new") }, preferences: { duration: "30to45", equipment: "gym", intensity: "moderate" }, completions: {}, activeWorkout: { slot: "0-am", sessionId: "old", steps: [] } }));
    expect(loadPersistedPlan().activeWorkout).toBeNull();
  });

  it("restores a valid version-three active workout and alert choices", () => {
    const guided = { ...session("guided"), exercises: ["ex-squat"] };
    localStorage.setItem("gt_plan", JSON.stringify({
      version: 3,
      plan: { "0-am": guided },
      preferences: { duration: "30to45", equipment: "gym", intensity: "moderate" },
      completions: {},
      workoutAlerts: { sound: true, vibration: false },
      activeWorkout: { slot: "0-am", sessionId: "guided", startedAt: 1, currentExerciseIndex: 0, phase: "exercise", steps: [{ exerciseId: "ex-squat", status: "completed" }] },
    }));
    const restored = loadPersistedPlan();
    expect(restored.activeWorkout?.steps[0].status).toBe("completed");
    expect(restored.workoutAlerts.sound).toBe(true);
  });
});
