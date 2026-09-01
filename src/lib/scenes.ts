// Curated editorial photography. Assets are bundled locally so a planned week
// never depends on a third-party image request. See public/images/CREDITS.md.

export type Scene =
  | "hero-week"
  | "dawn-run"
  | "barbell"
  | "kettlebell"
  | "yoga"
  | "trail"
  | "refuel"
  | "gym-dark";

export interface VisualAsset {
  src: string;
  alt: string;
  tone: string;
  credit: string;
  license: "Pexels License";
}

export const SCENES: Record<Scene, VisualAsset> = {
  // Black man deadlifting in a graffiti-wall gym — week opener
  "hero-week": { src: "/images/hero-week.webp", alt: "Lifter setting up a heavy barbell in a gym with a colourful mural", tone: "from-stone-900/70", credit: "Pexels photo 4720813", license: "Pexels License" },
  // Black man mid-stride on an outdoor track
  "dawn-run": { src: "/images/dawn-run.webp", alt: "Runner charging down an outdoor track", tone: "from-orange-900/60", credit: "Pexels photo 21923389", license: "Pexels License" },
  barbell: { src: "/images/barbell.webp", alt: "Barbell session in full flight", tone: "from-zinc-900/70", credit: "Pexels photo 4720813", license: "Pexels License" },
  kettlebell: { src: "/images/kettlebell.webp", alt: "Coach checking in after a hard round", tone: "from-stone-800/60", credit: "Pexels photo 6456299", license: "Pexels License" },
  // two women jogging the track, palm trees behind
  yoga: { src: "/images/yoga.webp", alt: "Track session under palm trees", tone: "from-teal-900/50", credit: "Pexels photo 20009464", license: "Pexels License" },
  trail: { src: "/images/trail.webp", alt: "Riverside run, braids in the wind", tone: "from-emerald-900/60", credit: "Pexels photo 8770397", license: "Pexels License" },
  // Kenyan woman serving ugali na sukuma wiki — verified KENYA LIVE shirt
  refuel: { src: "/images/refuel.webp", alt: "Ugali and sukuma wiki, served Kenyan-style", tone: "from-amber-900/50", credit: "Pexels photo 10677797", license: "Pexels License" },
  // smiling jogger on a sunny path
  "gym-dark": { src: "/images/gym-dark.webp", alt: "Smiling through the last kilometre", tone: "from-zinc-900/80", credit: "Pexels photo 8770400", license: "Pexels License" },
};

/** Scene for a session based on focus + time of day. */
export function sceneFor(focus: string, when?: string): Scene {
  if (focus === "cardio") return when === "am" ? "dawn-run" : "trail";
  if (focus === "mobility") return "yoga";
  if (focus === "legs") return "barbell";
  if (focus === "pull") return "kettlebell";
  return "gym-dark"; // push & core
}
