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

export interface SetupPreferences {
  duration: WorkoutDuration;
  equipment: EquipmentPreference;
  intensity: Intensity;
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
}

export interface Session {
  id: string;
  title: string;
  focus: MuscleGroup;
  intensity: Intensity;
  minutes: number;
  exercises: string[]; // exercise ids
  note?: string;
  /** Kenyan post-workout plate suggestion */
  refuel?: string;
  /** Additive detail for newer, specific Kenyan refuel suggestions. */
  refuelDetail?: RefuelDetail;
}

export interface RefuelDetail {
  id: string;
  title: string;
  plate: string;
  reason: string;
  tags: Array<"vegetarian" | "fish" | "chicken" | "meat" | "quick">;
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
