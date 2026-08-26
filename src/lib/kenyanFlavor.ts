// Kenyan flavour: Swahili-seasoned microcopy, ghost-slot copy, dish spotlights.
// Keep Swahili short, common and correct; lean on place/culture references.

export const GHOST_COPY_KENYA = [
  "Start strong — it's Monday.",
  "Hump-day heater?",
  "Midweek fire.",
  "Keep the streak, champ.",
  "Almost there, champ.",
  "Karura long-run morning?",
  "Gentle recovery flow.",
];

/** Time-aware greeting in EAT (Africa/Nairobi). */
export function greetingEat(hourUtcPlus3: number): { hello: string; hint: string } {
  if (hourUtcPlus3 < 11) return { hello: "Good morning!", hint: "Morning session sorted?" };
  if (hourUtcPlus3 < 17) return { hello: "Good afternoon,", hint: "the day is still trainable." };
  return { hello: "Good evening!", hint: "Evening plans? The grid awaits." };
}

export interface Dish {
  name: string;
  why: string;
}

export const REFUEL_SPOTLIGHTS: Dish[] = [
  { name: "Ugali na ndengu stew", why: "Slow carbs + green-gram protein. The classic recovery plate." },
  { name: "Sukuma wiki & chapati roll", why: "Iron-rich greens wrapped in a warm chapati." },
  { name: "Githeri bowl", why: "Maize and beans — complete protein, grandmother approved." },
  { name: "Mukimo (small sin, big recovery)", why: "Sweet potatoes, greens and maize. Leg-day currency." },
  { name: "Chai ya tangawizi + peanut toast", why: "Ginger tea for the lungs, PB for the rebuild." },
  { name: "Nyama choma, kichoma kagwira", why: "It's leg day. You earned every bite." },
];

/** Coach's margin notes with Kenyan training culture. */
export const MARGIN_NOTES = [
  "Fisi Club energy — the pack keeps you honest.",
  "Hash Harriers rule one: no excuses before the run. Or after.",
  "The fastest runner on the trail is whoever shows up. Show up.",
  "Slow is smooth, smooth is fast. Don't rush the warm-up.",
  "Kasarani stands are quiet this time of day. Perfect.",
];
