import { describe, expect, it } from "vitest";
import { LAUNCH_CASE } from "./store";
import {
  searchCase,
  readItem,
  crossReference,
  contradictionsInvolving,
  scoreAccusation,
} from "./caseEngine";

describe("case content integrity", () => {
  it("has 5 suspects, 20+ evidence items, 6 contradictions", () => {
    expect(LAUNCH_CASE.suspects.length).toBe(5);
    expect(LAUNCH_CASE.evidence.length).toBeGreaterThanOrEqual(20);
    expect(LAUNCH_CASE.contradictions.length).toBe(6);
  });

  it("every contradiction references real ids", () => {
    const ids = new Set([...LAUNCH_CASE.evidence.map((e) => e.id), ...LAUNCH_CASE.suspects.map((s) => s.id)]);
    for (const c of LAUNCH_CASE.contradictions) {
      expect(ids.has(c.aId), c.id).toBe(true);
      expect(ids.has(c.bId), c.id).toBe(true);
    }
  });

  it("solution keyEvidence and culprit are real ids", () => {
    const evIds = new Set(LAUNCH_CASE.evidence.map((e) => e.id));
    const susIds = new Set(LAUNCH_CASE.suspects.map((s) => s.id));
    expect(susIds.has(LAUNCH_CASE.solution.culpritId)).toBe(true);
    for (const k of LAUNCH_CASE.solution.keyEvidence) expect(evIds.has(k)).toBe(true);
    // red herrings must not include the culprit
    expect(LAUNCH_CASE.solution.redHerringSuspects).not.toContain(LAUNCH_CASE.solution.culpritId);
  });
});

describe("case engine", () => {
  it("search finds chai-related evidence ranked", () => {
    const hits = searchCase(LAUNCH_CASE, "chai grace") as unknown as Array<{ id: string; score: number }>;
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((h) => h.id === "ev-chai-flask")).toBe(true);
    expect(hits[0].score).toBeGreaterThanOrEqual(hits[hits.length - 1].score);
  });

  it("readItem returns evidence and suspects, null for unknown", () => {
    expect((readItem(LAUNCH_CASE, "ev-taxi-receipt") as { title: string }).title).toContain("Taxi");
    expect((readItem(LAUNCH_CASE, "sus-grace") as { type: string }).type).toBe("suspect");
    expect(readItem(LAUNCH_CASE, "nope")).toBeNull();
  });

  it("readItem never leaks the solution flags", () => {
    const s = readItem(LAUNCH_CASE, "sus-akinyi") as Record<string, unknown>;
    expect(JSON.stringify(s)).not.toContain("_isCulprit");
    expect(readItem(LAUNCH_CASE, "sus-grace")).toBeTruthy();
  });

  it("cross_reference finds the Grace/Wanda veranda contradiction", () => {
    const cons = crossReference(LAUNCH_CASE, ["ev-grace-statement", "ev-taxi-receipt"]);
    expect(cons.some((c) => c.id === "con-veranda")).toBe(true);
  });

  it("contradictionsInvolving catches one-sided matches", () => {
    const cons = contradictionsInvolving(LAUNCH_CASE, ["ev-doctor-report"]);
    expect(cons.length).toBeGreaterThanOrEqual(1); // con-tea-vs-meds at minimum
  });

  it("scoring: correct accusation with full chain scores 100", () => {
    const r = scoreAccusation(
      LAUNCH_CASE,
      LAUNCH_CASE.solution.culpritId,
      LAUNCH_CASE.solution.keyEvidence,
    );
    expect(r.correct).toBe(true);
    expect(r.deductionScore).toBe(100);
  });

  it("scoring: wrong accusation scores low but explains", () => {
    const r = scoreAccusation(LAUNCH_CASE, "sus-david", []);
    expect(r.correct).toBe(false);
    expect(r.deductionScore).toBeLessThan(30);
    expect(r.explanation.length).toBeGreaterThan(50);
  });
});
