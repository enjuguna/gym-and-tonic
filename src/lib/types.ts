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
}

export interface SessionGenerationOptions extends Partial<SetupPreferences> {}

export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type Meal = "am" | "pm";
export type Slot = `${DayIndex}-${Meal}`;

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
}

export interface GearItem {
  item: string;
  uses: number;
}
