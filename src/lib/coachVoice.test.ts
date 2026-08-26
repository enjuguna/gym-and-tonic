import { describe, expect, it } from "vitest";
import { coachLine } from "./coachVoice";

describe("coachLine", () => {
  it("comments on placing leg day", () => {
    expect(coachLine({ kind: "place", focus: "legs", by: "player" })).toMatch(/wheel|leg|squat/i);
  });

  it("agent placements sound like a partner", () => {
    expect(coachLine({ kind: "place", focus: "pull", by: "agent" })).toMatch(/coach/i);
  });

  it("rest days are celebrated, not shamed", () => {
    expect(coachLine({ kind: "clear", by: "player" })).toMatch(/rest|recover|muscle/i);
  });

  it("deterministic per detail string", () => {
    const a = coachLine({ kind: "place", focus: "core", by: "player", detail: "x" });
    expect(a).toBe(coachLine({ kind: "place", focus: "core", by: "player", detail: "x" }));
  });

  it("connection line mentions tools", () => {
    expect(coachLine({ kind: "connect", by: "system" })).toMatch(/coach|tools/i);
  });
});
