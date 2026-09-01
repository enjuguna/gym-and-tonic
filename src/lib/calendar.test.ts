import { describe, expect, it } from "vitest";
import { planToICS } from "./calendar";
import type { Session } from "./types";

const planned: Session = { id: "s1", title: "Karura Trail Run", focus: "cardio", intensity: "moderate", minutes: 30, exercises: ["ex-run"] };

describe("calendar export", () => {
  it("creates portable events without leaking notes or reflections", () => {
    const ics = planToICS({ "0-am": { ...planned, note: "private note" } });
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("SUMMARY:Karura Trail Run");
    expect(ics).toContain("DESCRIPTION:cardio · moderate · 30 minutes");
    expect(ics).not.toContain("private note");
  });

  it("exports an empty calendar safely", () => {
    expect(planToICS({})).toContain("END:VCALENDAR");
  });
});
