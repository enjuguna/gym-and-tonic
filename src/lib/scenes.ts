// Curated scene photography — Kenya/African-first (Pexels CDN, free license).
// Every ID verified 200 + visually reviewed for subject/setting.

export type Scene =
  | "hero-week"
  | "dawn-run"
  | "barbell"
  | "kettlebell"
  | "yoga"
  | "trail"
  | "refuel"
  | "gym-dark";

const PIX = (id: string, w = 1200) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

export const SCENES: Record<Scene, { src: string; alt: string; tone: string }> = {
  // Black man deadlifting in a graffiti-wall gym — week opener
  "hero-week": { src: PIX("4720813", 1600), alt: "Lifter setting up a heavy barbell in a gym with a colourful mural", tone: "from-stone-900/70" },
  // Black man mid-stride on an outdoor track
  "dawn-run": { src: PIX("21923389", 1600), alt: "Runner charging down an outdoor track", tone: "from-orange-900/60" },
  barbell: { src: PIX("4720813"), alt: "Barbell session in full flight", tone: "from-zinc-900/70" },
  kettlebell: { src: PIX("6456299"), alt: "Coach checking in after a hard round", tone: "from-stone-800/60" },
  // two women jogging the track, palm trees behind
  yoga: { src: PIX("20009464"), alt: "Track session under palm trees", tone: "from-teal-900/50" },
  trail: { src: PIX("8770397"), alt: "Riverside run, braids in the wind", tone: "from-emerald-900/60" },
  // Kenyan woman serving ugali na sukuma wiki — verified KENYA LIVE shirt
  refuel: { src: PIX("10677797"), alt: "Ugali and sukuma wiki, served Kenyan-style", tone: "from-amber-900/50" },
  // smiling jogger on a sunny path
  "gym-dark": { src: PIX("8770400"), alt: "Smiling through the last kilometre", tone: "from-zinc-900/80" },
};

/** Scene for a session based on focus + time of day. */
export function sceneFor(focus: string, when?: string): Scene {
  if (focus === "cardio") return when === "am" ? "dawn-run" : "trail";
  if (focus === "mobility") return "yoga";
  if (focus === "legs") return "barbell";
  if (focus === "pull") return "kettlebell";
  return "gym-dark"; // push & core
}
