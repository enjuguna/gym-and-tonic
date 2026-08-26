import { describe, expect, it, beforeEach } from "vitest";
import {
  currentWeekKey,
  loadHistory,
  overloadCheck,
  personalRecords,
  saveWeek,
} from "./history";
import type { Session } from "./types";
import type { WeekRecord } from "./history";

const mk = (id: string, focus: Session["focus"], minutes: number): Session => ({
  id, title: id, focus, intensity: "moderate", minutes, exercises: [],
});

beforeEach(() => localStorage.clear());

describe("week key", () => {
  it("produces an ISO-style key", () => {
    expect(currentWeekKey(new Date("2026-08-26"))).toMatch(/^\d{4}-W\d{2}$/);
  });
});

describe("overloadCheck", () => {
  it("first week is a clean slate", () => {
    const r = overloadCheck([mk("a", "legs", 40)], []);
    expect(r.headline).toMatch(/first week|PR/i);
    expect(r.insights.length).toBe(0);
  });

  it("detects progression and gives advice", () => {
    const prev: WeekRecord = { weekKey: "2026-W34", sessions: [mk("p1", "legs", 30)], completedAt: 1 };
    const r = overloadCheck([mk("c1", "legs", 45)], [prev]);
    const legs = r.insights.find((i) => i.focus === "legs")!;
    expect(legs.deltaPct).toBe(50);
    expect(legs.advice).toMatch(/jump|progression/i);
    expect(r.headline).toMatch(/climbing|graph|trending|loves/i);
  });

  it("flags dropped groups", () => {
    const prev: WeekRecord = { weekKey: "2026-W34", sessions: [mk("p1", "pull", 30)], completedAt: 1 };
    const r = overloadCheck([], [prev]);
    const pull = r.insights.find((i) => i.focus === "pull")!;
    expect(pull.thisWeekMinutes).toBe(0);
    expect(pull.advice).toMatch(/dropped/i);
  });
});

describe("history persistence + PRs", () => {
  it("saves and loads weeks without duplicating a key", () => {
    saveWeek("2026-W35", [mk("a", "legs", 30)]);
    saveWeek("2026-W35", [mk("b", "push", 25)]); // same key → replaced
    expect(loadHistory().length).toBe(1);
    expect(loadHistory()[0].sessions[0].id).toBe("b");
  });

  it("personalRecords aggregates all-time", () => {
    saveWeek("2026-W34", [mk("a", "legs", 60)]);
    const cur = [mk("c", "cardio", 45)];
    const pr = personalRecords(loadHistory(), cur);
    expect(pr.weeksTracked).toBe(2);
    expect(pr.totalSessionsAllTime).toBe(2);
    expect(pr.biggestSession?.title).toBe("a"); // 60 min wins
  });
});
