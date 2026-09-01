import { beforeEach, describe, expect, it } from "vitest";
import { deleteTemplate, loadTemplates, saveTemplate } from "./templates";
import type { Session } from "./types";

const session: Session = { id: "s1", title: "First session", focus: "legs", intensity: "light", minutes: 20, exercises: [] };
const preferences = { duration: "under30" as const, equipment: "home" as const, intensity: "light" as const };

beforeEach(() => localStorage.clear());

describe("local templates", () => {
  it("saves and loads a named rhythm", () => {
    const saved = saveTemplate("Morning rhythm", { "0-am": session }, preferences);
    expect(saved?.name).toBe("Morning rhythm");
    expect(loadTemplates()).toHaveLength(1);
    expect(loadTemplates()[0].plan["0-am"]?.title).toBe("First session");
  });

  it("rejects malformed stored templates and supports deletion", () => {
    localStorage.setItem("gt_templates", JSON.stringify({ version: 1, templates: [{ id: "bad" }, { id: "also-bad", plan: {} }] }));
    expect(loadTemplates()).toEqual([]);
    const saved = saveTemplate("Keep", { "0-am": session }, preferences)!;
    deleteTemplate(saved.id);
    expect(loadTemplates()).toEqual([]);
  });
});
