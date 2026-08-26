import { describe, expect, it } from "vitest";
import { EXERCISES, balanceCheck, gearList, generateSession, exerciseById } from "./coach";
import type { Session } from "./types";

describe("exercise catalogue", () => {
  it("covers all six groups", () => {
    for (const g of ["legs", "push", "pull", "core", "cardio", "mobility"]) {
      expect(EXERCISES.some((e) => e.group === g), g).toBe(true);
    }
  });
  it("lookup works and misses cleanly", () => {
    expect(exerciseById("ex-squat")?.name).toBe("Back squat");
    expect(exerciseById("nope")).toBeUndefined();
  });
});

describe("gearList", () => {
  it("aggregates unique equipment per session", () => {
    const s: Session = { id: "1", title: "T", focus: "legs", intensity: "moderate", minutes: 25, exercises: ["ex-squat", "ex-lunge"] };
    const gear = gearList([s]);
    expect(gear.barbell).toBe(1);
    expect(gear.rack).toBe(1);
  });
  it("ignores empty slots", () => {
    expect(Object.keys(gearList([null, null])).length).toBe(0);
  });
});

describe("balanceCheck", () => {
  it("flags skipped leg day with prejudice", () => {
    const push: Session = { id: "1", title: "P", focus: "push", intensity: "moderate", minutes: 40, exercises: ["ex-bench"] };
    const r = balanceCheck([push]);
    expect(r.neglected).toContain("legs");
    expect(r.verdict).toMatch(/leg day|squats/i);
  });
  it("praises a balanced week", () => {
    const mk = (id: string, focus: Session["focus"]): Session => ({ id, title: id, focus, intensity: "light", minutes: 30, exercises: [] });
    const r = balanceCheck(["legs", "push", "pull", "core", "cardio", "mobility"].map((g) => mk(g, g as Session["focus"])));
    expect(r.totalMinutes).toBe(180);
    expect(r.verdict).toMatch(/balanced/i);
    expect(r.neglected.length).toBe(0);
  });
});

describe("generateSession", () => {
  it("produces a session in the requested group", () => {
    const s = generateSession("pull");
    expect(s.focus).toBe("pull");
    expect(s.exercises.length).toBeGreaterThanOrEqual(2);
    expect(s.minutes).toBeGreaterThanOrEqual(20);
    expect(s.refuel).toBeTruthy();
  });
});
