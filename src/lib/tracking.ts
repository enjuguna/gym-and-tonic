import type { DietaryPreference, FitnessGoal, HabitChecks, HabitId, WeightEntries, WeightUnit, WalkingEntries } from "./types";

export const TRACKING_KEY = "gt_tracking";
export const TRACKING_VERSION = 1;
export const HABITS: Array<{ id: HabitId; label: string }> = [
  { id: "movement-break", label: "Take a movement break" },
  { id: "vegetables", label: "Include vegetables with a meal" },
  { id: "prepare-meal", label: "Prepare a meal at home" },
  { id: "wind-down", label: "Take a calm wind-down" },
  { id: "screen-free-bedtime", label: "Put screens away before bed" },
];

export interface TrackingRecord {
  version: number;
  goal: FitnessGoal;
  weightUnit: WeightUnit;
  dietaryPreference: DietaryPreference;
  weightEntries: WeightEntries;
  weightEnabled: boolean;
  targetWeightKg?: number;
  walking: WalkingEntries;
  selectedHabits: HabitId[];
  habitChecks: HabitChecks;
  mealFavorites: string[];
}

export const DEFAULT_TRACKING: TrackingRecord = {
  version: TRACKING_VERSION, goal: "general-fitness", weightUnit: "kg", dietaryPreference: "omnivore",
  weightEntries: {}, weightEnabled: false, walking: {}, selectedHabits: [], habitChecks: {}, mealFavorites: [],
};

function isGoal(value: unknown): value is FitnessGoal { return ["weight-loss", "general-fitness", "build-strength"].includes(String(value)); }
function isUnit(value: unknown): value is WeightUnit { return value === "kg" || value === "lb"; }
function isDiet(value: unknown): value is DietaryPreference { return ["omnivore", "vegetarian", "vegan", "pescatarian"].includes(String(value)); }

export function loadTracking(): TrackingRecord {
  if (typeof window === "undefined") return DEFAULT_TRACKING;
  try {
    const raw = JSON.parse(window.localStorage.getItem(TRACKING_KEY) ?? "null") as Partial<TrackingRecord> | null;
    return sanitizeTrackingRecord(raw);
  } catch { return DEFAULT_TRACKING; }
}

export function sanitizeTrackingRecord(value: unknown): TrackingRecord {
  try {
    const raw = value as Partial<TrackingRecord> | null;
    if (!raw || raw.version !== TRACKING_VERSION) return DEFAULT_TRACKING;
    const weightEntries = Object.fromEntries(Object.entries(raw.weightEntries ?? {}).filter(([date, value]) =>
      /^\d{4}-\d{2}-\d{2}$/.test(date) && !!value && typeof value === "object" && Number.isFinite((value as { kg?: number }).kg) && (value as { kg: number }).kg > 0,
    ));
    return {
      ...DEFAULT_TRACKING, ...raw,
      goal: isGoal(raw.goal) ? raw.goal : DEFAULT_TRACKING.goal,
      weightUnit: isUnit(raw.weightUnit) ? raw.weightUnit : DEFAULT_TRACKING.weightUnit,
      dietaryPreference: isDiet(raw.dietaryPreference) ? raw.dietaryPreference : DEFAULT_TRACKING.dietaryPreference,
      weightEntries, weightEnabled: raw.weightEnabled === true, walking: Object.fromEntries(Object.entries(raw.walking ?? {}).filter(([date, value]) => /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(value) && Number(value) >= 0)),
      selectedHabits: Array.isArray(raw.selectedHabits) ? raw.selectedHabits.filter((id): id is HabitId => HABITS.some((habit) => habit.id === id)).slice(0, 3) : [],
      habitChecks: raw.habitChecks && typeof raw.habitChecks === "object" ? raw.habitChecks : {},
      mealFavorites: Array.isArray(raw.mealFavorites) ? raw.mealFavorites.filter((id): id is string => typeof id === "string") : [],
    };
  } catch { return DEFAULT_TRACKING; }
}

export function isTrackingRecord(value: unknown): value is TrackingRecord {
  if (!value || typeof value !== "object") return false;
  const raw = value as Partial<TrackingRecord>;
  const validDates = (record: unknown, valid: (item: unknown) => boolean) => !!record && typeof record === "object" && Object.entries(record).every(([date, item]) => /^\d{4}-\d{2}-\d{2}$/.test(date) && valid(item));
  return raw.version === TRACKING_VERSION && isGoal(raw.goal) && isUnit(raw.weightUnit) && isDiet(raw.dietaryPreference) && typeof raw.weightEnabled === "boolean" &&
    validDates(raw.weightEntries, (item) => !!item && typeof item === "object" && Number.isFinite((item as { kg?: number }).kg) && (item as { kg: number }).kg > 0) &&
    validDates(raw.walking, (item) => typeof item === "number" && Number.isFinite(item) && item >= 0) &&
    Array.isArray(raw.selectedHabits) && raw.selectedHabits.every((id) => HABITS.some((habit) => habit.id === id)) && Array.isArray(raw.mealFavorites) && raw.mealFavorites.every((id) => typeof id === "string") &&
    (raw.targetWeightKg === undefined || (typeof raw.targetWeightKg === "number" && Number.isFinite(raw.targetWeightKg) && raw.targetWeightKg > 0));
}

export function saveTracking(record: TrackingRecord): boolean {
  if (typeof window === "undefined") return false;
  try { window.localStorage.setItem(TRACKING_KEY, JSON.stringify({ ...record, version: TRACKING_VERSION })); return true; } catch { return false; }
}

export function kgForDisplay(kg: number, unit: WeightUnit): number { return unit === "lb" ? kg * 2.2046226218 : kg; }
export function kgFromDisplay(value: number, unit: WeightUnit): number { return unit === "lb" ? value / 2.2046226218 : value; }
export function localDateKey(date = new Date()): string { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
