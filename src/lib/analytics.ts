/**
 * Deliberately tiny analytics boundary. Event names convey product behaviour
 * only; training content, identifiers, notes and slots never cross it.
 */
export const ANALYTICS_EVENTS = [
  "showcase_open_planner",
  "planner_opened",
  "first_session_placed",
  "workout_started",
  "workout_finished",
  "plan_exported",
  "plan_imported",
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

declare global {
  interface Window {
    plausible?: (event: string) => void;
  }
}

export function track(event: AnalyticsEvent) {
  if (typeof window === "undefined" || window.localStorage.getItem("gt_analytics_opt_out") === "true") return;
  window.plausible?.(event);
}

export function analyticsDisabled() {
  return typeof window !== "undefined" && window.localStorage.getItem("gt_analytics_opt_out") === "true";
}

export function setAnalyticsDisabled(disabled: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("gt_analytics_opt_out", String(disabled));
}
