import { describe, expect, it } from "vitest";
import { narrate } from "./narrator";

describe("narrate", () => {
  it("returns a line for pinning evidence", () => {
    const line = narrate({ type: "pin", itemId: "ev-chai-flask", by: "player" });
    expect(line).toMatch(/flask|chai|print|tea/i);
  });

  it("varies lines deterministically per item", () => {
    const a = narrate({ type: "pin", itemId: "ev-taxi-receipt", by: "player" });
    expect(a).toBe(narrate({ type: "pin", itemId: "ev-taxi-receipt", by: "player" }));
  });

  it("has distinct voice for agent proposals", () => {
    const p = narrate({ type: "pin", itemId: "ev-chai-flask", by: "agent" });
    expect(p).toMatch(/partner/i);
  });

  it("covers contradiction discoveries", () => {
    expect(narrate({ type: "contradiction", id: "con-veranda" })).toMatch(
      /crack|wobble|story/i,
    );
  });

  it("falls back gracefully for unknown items", () => {
    const line = narrate({ type: "pin", itemId: "ev-unknown-xyz", by: "player" });
    expect(line.length).toBeGreaterThan(5);
  });

  it("theory status changes get their own voice", () => {
    expect(narrate({ type: "theory", status: "accepted" })).toMatch(/shape|nod/i);
    expect(narrate({ type: "theory", status: "challenged" })).toMatch(/mentalist|fast/i);
  });
});
