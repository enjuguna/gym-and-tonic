import { beforeEach, describe, expect, it } from "vitest";
import { useBoard, LAUNCH_CASE } from "../src/lib/store";
import { scoreAccusation } from "../src/lib/caseEngine";
import {
  getCaseBriefingTool,
  searchEvidenceTool,
  readEvidenceTool,
  listSuspectsTool,
  crossReferenceTool,
  pinEvidenceTool,
  addNoteTool,
  proposeTheoryTool,
  requestAccusationReviewTool,
} from "../src/lib/webmcp";

const CASE = LAUNCH_CASE.id;
const S = () => useBoard.getState();
const run = (t: { execute: (a: any) => any }, args: unknown) => t.execute(args);

beforeEach(() => {
  useBoard.setState({ pins: [], notes: [], theories: [], proposals: [] });
});

describe("E2E: judge journey — solve The Vigil at Karura House with the agent", () => {
  it("full partnership workflow", () => {
    // 1. orient
    const brief = run(getCaseBriefingTool, { caseId: CASE });
    expect(brief.briefing).toContain("blackout");
    expect(JSON.stringify(brief)).not.toContain("_isCulprit"); // solution never leaks

    const dossiers = run(listSuspectsTool, { caseId: CASE });
    expect(dossiers.count).toBe(5);

    // 2. search
    const hits = run(searchEvidenceTool, { caseId: CASE, query: "chai flask fingerprints" });
    expect(hits.hitCount).toBeGreaterThan(0);

    // 3. read the key items
    const grace = run(readEvidenceTool, { caseId: CASE, itemId: "ev-grace-statement" });
    expect(grace.content).toContain("veranda");

    // 4. cross-reference the alibi against the taxi receipt — the crack in the case
    const cons = run(crossReferenceTool, {
      caseId: CASE,
      itemIds: ["ev-grace-statement", "ev-taxi-receipt"],
    });
    expect(cons.directContradictions.some((c: { id: string }) => c.id === "con-veranda")).toBe(true);

    // 5. partner pins evidence — staged, not on the board yet
    const pin1 = run(pinEvidenceTool, {
      caseId: CASE,
      itemId: "ev-taxi-receipt",
      reason: "Places Wanda at the gate at 20:12, before the blackout — contradicts Grace's veranda story.",
    });
    expect(S().pins.length).toBe(0); // nothing silently committed
    expect(S().proposals[0].state).toBe("pending");
    S().approveProposal(pin1.proposalId);
    expect(S().pins.length).toBe(1);

    // 6. player rejects a bad pin (double-billed reasoning is noise here)
    const badPin = run(pinEvidenceTool, {
      caseId: CASE,
      itemId: "ev-bar-receipt",
      reason: "just curious",
    });
    S().undoProposal(badPin.proposalId);
    expect(S().pins.length).toBe(1);

    // 6b. partner pins the rest of the chain as it verifies them
    for (const [itemId, reason] of [
      ["ev-pharmacy-log", "Grace collected Charles's medication early, on 09 July, without mentioning it."],
      ["ev-med-bottle", "Tool marks on the cap: the medication was tampered with."],
      ["ev-wanda-statement", "Wanda denies being on any veranda and was home before nine."],
      ["ev-grace-statement", "Her alibi requires Wanda to still be present after 21:05."],
    ] as const) {
      const p = run(pinEvidenceTool, { caseId: CASE, itemId, reason });
      S().approveProposal(p.proposalId);
    }

    // 7. annotate a pinned card
    const note = run(addNoteTool, {
      caseId: CASE,
      pinItemId: "ev-taxi-receipt",
      text: "20:12 + dry roads ⇒ Wanda truly left pre-blackout.",
    });
    S().approveProposal(note.proposalId);
    expect(S().notes.length).toBe(1);

    // 8. partner proposes the theory; player accepts
    const theory = run(proposeTheoryTool, {
      caseId: CASE,
      claim: "Grace poisoned the heart medication, not the chai — and her alibi depends on a witness who had already left.",
      supportingEvidenceIds: ["ev-pharmacy-log", "ev-med-bottle", "ev-taxi-receipt", "ev-grace-statement", "ev-wanda-statement"],
      openQuestions: ["Who was Charles calling on Friday?"],
    });
    S().approveProposal(theory.proposalId);
    expect(S().theories.length).toBe(1);
    S().setTheoryStatus(S().theories[0].id, "accepted");

    // 9. partner recommends accusation — but cannot accuse
    const rec = run(requestAccusationReviewTool, {
      caseId: CASE,
      suspectId: "sus-grace",
      reasoning: "Veranda alibi contradicted by taxi receipt; pharmacy collection unexplained; only prints on flask she insists on drawing attention to.",
    });
    expect(rec.status).toBe("pending-player-decision");
    S().approveProposal(rec.proposalId);

    // 10. PLAYER makes the accusation themselves with the board as citations
    const cited = S().pins.map((p) => p.itemId);
    expect(cited).toContain("ev-taxi-receipt");
    const verdict = scoreAccusation(LAUNCH_CASE, "sus-grace", cited);
    expect(verdict.correct).toBe(true);
    expect(verdict.deductionScore).toBeGreaterThanOrEqual(80);
  });

  it("tool guards: unknown ids, empty reasons, uncited theories", () => {
    expect(run(searchEvidenceTool, { caseId: "x", query: "chai" }).error).toBeDefined();
    expect(run(readEvidenceTool, { caseId: CASE, itemId: "nope" }).error).toBeDefined();
    expect(
      run(pinEvidenceTool, { caseId: CASE, itemId: "ev-chai-flask", reason: "" }).error,
    ).toBeDefined();
    expect(
      run(proposeTheoryTool, {
        caseId: CASE,
        claim: "hunch",
        supportingEvidenceIds: ["only-one-id"],
      }).error ?? undefined,
    ).toBeDefined(); // minItems 2 enforced by schema; engine tolerates but schema gates agents
    expect(
      run(requestAccusationReviewTool, { caseId: CASE, suspectId: "sus-ghost", reasoning: "x" }).error,
    ).toBeDefined();
  });
});
