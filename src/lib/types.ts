// Gym & Tonic domain model — weekly training planner

export type MuscleGroup =
  | "legs"
  | "push"
  | "pull"
  | "core"
  | "cardio"
  | "mobility";

export type Intensity = "light" | "moderate" | "brutal";

export interface Exercise {
  id: string;
  name: string;
  group: MuscleGroup;
  /** minutes */
  duration: number;
  equipment: string[];
  cues: string;
}

export interface Slot {
  day: number; // 0=Mon .. 6=Sun
  meal: "am" | "pm"; // morning / evening session
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
