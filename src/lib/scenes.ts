// Curated scene photography (Pexels CDN, free license) with graceful
// gradient fallbacks handled in SceneImage.

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
  "hero-week": { src: PIX("416778", 1600), alt: "Barbell loaded with plates on a dark floor", tone: "from-stone-900/70" },
  "dawn-run": { src: PIX("2803158"), alt: "Runner out at dawn", tone: "from-orange-900/60" },
  barbell: { src: PIX("1552252"), alt: "Chalked hands gripping a barbell", tone: "from-zinc-900/70" },
  kettlebell: { src: PIX("703016"), alt: "Kettlebell resting on a gym floor", tone: "from-stone-800/60" },
  yoga: { src: PIX("3822906"), alt: "Yoga mat in warm light", tone: "from-teal-900/50" },
  trail: { src: PIX("1571939"), alt: "Forest trail in morning mist", tone: "from-emerald-900/60" },
  refuel: { src: PIX("1640777"), alt: "A hearty post-workout bowl", tone: "from-amber-900/50" },
  "gym-dark": { src: PIX("1229356"), alt: "Moody gym interior with iron", tone: "from-zinc-900/80" },
};

/** Scene for a session based on focus + time of day. */
export function sceneFor(focus: string, when?: string): Scene {
  if (focus === "cardio") return when === "am" ? "dawn-run" : "trail";
  if (focus === "mobility") return "yoga";
  if (focus === "legs") return "barbell";
  if (focus === "pull") return "kettlebell";
  return "gym-dark"; // push & core
}
