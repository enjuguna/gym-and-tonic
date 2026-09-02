import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { WorkoutMode } from "./WorkoutMode";
import { usePlan } from "../../lib/store";

beforeEach(() => {
  localStorage.clear();
  usePlan.setState({ plan: {}, proposals: [], activityLog: [], preferences: { duration: "30to45", equipment: "gym", intensity: "moderate" }, hasStarted: false, setupDismissed: false, completions: {}, reviewing: false, activeWorkout: null, workoutAlerts: { sound: false, vibration: false } });
});

describe("WorkoutMode completion", () => {
  it("marks the session complete after the final exercise action and opens reflection", () => {
    const session = { id: "guided", title: "A short session", focus: "core" as const, intensity: "light" as const, minutes: 20, exercises: ["ex-plank"] };
    usePlan.getState().placeSession("0-am", session);
    usePlan.getState().startWorkout("0-am");
    const onFinished = vi.fn();
    render(React.createElement(WorkoutMode, { session, onClose: vi.fn(), onFinished }));

    fireEvent.click(screen.getByRole("button", { name: "Mark exercise done" }));

    expect(usePlan.getState().completions["0-am"]).toBeDefined();
    expect(usePlan.getState().activeWorkout).toBeNull();
    expect(onFinished).toHaveBeenCalledOnce();
  });
});
