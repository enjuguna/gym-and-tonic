// Gym & Tonic domain model — weekly training planner

export type MuscleGroup =
  | "legs"
  | "push"
  | "pull"
  | "core"
  | "cardio"
  | "mobility";

export type Intensity = "light" | "moderate" | "brutal";
export type WorkoutDuration = "under30" | "30to45" | "45plus";
export type EquipmentPreference = "home" | "gym";
export type FitnessGoal = "weight-loss" | "general-fitness" | "build-strength";
export type ExperienceLevel = "beginner" | "returning" | "regular";
export type DietaryPreference = "omnivore" | "vegetarian" | "vegan" | "pescatarian";
export type WeightUnit = "kg" | "lb";

export interface SetupPreferences {
  duration: WorkoutDuration;
  equipment: EquipmentPreference;
  intensity: Intensity;
  goal?: FitnessGoal;
  experience?: ExperienceLevel;
  lowImpact?: boolean;
  dietaryPreference?: DietaryPreference;
  weightUnit?: WeightUnit;
  trainingDays?: DayIndex[];
  restDays?: DayIndex[];
}

export interface SessionGenerationOptions extends Partial<SetupPreferences> {
  /** Refuel ids already used on the board, used to keep the week varied. */
  excludeRefuelIds?: string[];
}

export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type Meal = "am" | "pm";
export type Slot = `${DayIndex}-${Meal}`;

export interface CompletionEntry {
  completedAt: number;
  note?: string;
  effort?: 1 | 2 | 3 | 4 | 5;
}

export type CompletionMap = Partial<Record<Slot, CompletionEntry>>;

export type WorkoutStepStatus = "pending" | "completed" | "skipped";
export type WorkoutPhase = "exercise" | "rest" | "paused";

export interface WorkoutStep {
  exerciseId: string;
  status: WorkoutStepStatus;
}

export interface WorkoutTimer {
  kind: "exercise" | "rest";
  status: "running" | "paused" | "finished";
  /** Wall-clock timestamp used to recover a running timer after reload. */
  endsAt?: number;
  /** Remaining time while paused. */
  remainingMs?: number;
}

export interface ActiveWorkout {
  slot: Slot;
  sessionId: string;
  startedAt: number;
  currentExerciseIndex: number;
  phase: WorkoutPhase;
  steps: WorkoutStep[];
  timer?: WorkoutTimer;
}

export interface WorkoutAlertPreferences {
  sound: boolean;
  vibration: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  group: MuscleGroup;
  /** minutes */
  duration: number;
  equipment: string[];
  cues: string;
  instructions?: string;
  impact?: "low" | "moderate" | "high";
  easierAlternative?: string;
  blockMinutes?: number;
}

export interface Session {
  id: string;
  title: string;
  focus: MuscleGroup;
  intensity: Intensity;
  minutes: number;
  exercises: string[]; // exercise ids
  note?: string;
  /** Post-workout meal suggestion */
  refuel?: string;
  /** Additive detail for newer, specific meal suggestions. */
  refuelDetail?: RefuelDetail;
}

export interface RefuelDetail {
  id: string;
  title: string;
  plate: string;
  reason: string;
  tags: Array<"vegetarian" | "vegan" | "fish" | "chicken" | "meat" | "quick">;
  prepMinutes?: number;
  ingredients?: string[];
  substitutions?: string[];
}

export interface GearItem {
  item: string;
  uses: number;
}

export interface WeekTemplate {
  id: string;
  name: string;
  plan: Partial<Record<Slot, Session>>;
  preferences: SetupPreferences;
  createdAt: number;
}

export interface WeightEntry { date: string; kg: number; }
export type WeightEntries = Record<string, WeightEntry>;
export type WalkingEntries = Record<string, number>;
export type HabitId = "movement-break" | "vegetables" | "prepare-meal" | "wind-down" | "screen-free-bedtime";
export type HabitChecks = Record<string, Partial<Record<HabitId, boolean>>>;
