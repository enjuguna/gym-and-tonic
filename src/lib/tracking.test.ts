import { describe, expect, it } from "vitest";
import { DEFAULT_TRACKING, kgForDisplay, kgFromDisplay, sanitizeTrackingRecord } from "./tracking";

describe("tracking safety", () => {
  it("falls back for malformed or outdated records", () => {
    expect(sanitizeTrackingRecord({ version: 0 })).toEqual(DEFAULT_TRACKING);
    expect(sanitizeTrackingRecord({ version: 1, weightEntries: { bad: { kg: -3 } } })).toEqual(DEFAULT_TRACKING);
  });
  it("converts weight units from canonical kilograms", () => {
    expect(kgFromDisplay(220.462, "lb")).toBeCloseTo(100, 2);
    expect(kgForDisplay(100, "lb")).toBeCloseTo(220.462, 2);
  });
});
