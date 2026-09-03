import { describe, expect, it } from "vitest";
import { applyContentRefresh, previewContentRefresh } from "./contentRefresh";

describe("legacy content refresh", () => {
  it("previews and refreshes only recognized labels while preserving identity and notes", () => {
    const plan = { "0-am": { id: "keep-me", title: "Push Past Westlands", focus: "push" as const, intensity: "light" as const, minutes: 20, exercises: ["ex-wall-push"], note: "my note", refuel: "Githeri bowl" } };
    expect(previewContentRefresh(plan)).toHaveLength(1);
    const refreshed = applyContentRefresh(plan)["0-am"];
    expect(refreshed.id).toBe("keep-me");
    expect(refreshed.note).toBe("my note");
    expect(refreshed.title).toBe("Upper Body Push");
    expect(refreshed.refuelDetail?.title).toBe("Rice, lentils & greens");
  });

  it("leaves current global content unchanged", () => {
    const session = { id: "current", title: "Upper Body Push", focus: "push" as const, intensity: "light" as const, minutes: 20, exercises: ["ex-wall-push"] };
    expect(previewContentRefresh({ "0-am": session })).toEqual([]);
  });
});
