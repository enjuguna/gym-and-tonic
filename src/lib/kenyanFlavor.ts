// Kenyan flavour: Swahili-seasoned microcopy and everyday refuel plates.
// Keep Swahili short, common and correct; lean on place/culture references.
import type { RefuelDetail, Session } from "./types";

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

/** Everyday Kenyan plates, intentionally varied across legumes, fish, chicken and meat. */
export const REFUEL_CATALOG: RefuelDetail[] = [
  { id: "ndengu-rice", title: "Ndengu & rice", plate: "Ndengu stew, rice, sukuma wiki and avocado", reason: "A familiar plate with legumes, greens and a satisfying starch.", tags: ["vegetarian"] },
  { id: "tilapia-ugali", title: "Tilapia, ugali & sukuma", plate: "Grilled tilapia, ugali and sautéed sukuma wiki", reason: "Fish, greens and ugali make a proper, unpretentious plate.", tags: ["fish"] },
  { id: "chapati-maharagwe", title: "Chapati & maharagwe", plate: "Chapati, maharagwe stew and fresh kachumbari", reason: "A Nairobi favourite with beans and a fresh side.", tags: ["vegetarian", "quick"] },
  { id: "githeri-avocado", title: "Githeri & avocado", plate: "Githeri with avocado and kachumbari", reason: "Maize, beans and avocado in a familiar home-style combination.", tags: ["vegetarian"] },
  { id: "mukimo-njahi-chicken", title: "Mukimo wa njahi & chicken", plate: "Mukimo wa njahi with kienyeji chicken and greens", reason: "A hearty Central Kenyan-style plate with a real protein centre.", tags: ["chicken"] },
  { id: "matoke-beef", title: "Matoke & beef stew", plate: "Matoke, beef stew and seasonal greens", reason: "Soft matoke and stew make an easy, filling evening meal.", tags: ["meat"] },
  { id: "omena-managu", title: "Omena, ugali & managu", plate: "Omena, ugali and sautéed managu", reason: "A classic lake-region-inspired plate with greens on the side.", tags: ["fish"] },
  { id: "sweet-potato-beans", title: "Sweet potatoes & beans", plate: "Boiled sweet potatoes, bean stew and spinach", reason: "Simple pantry staples that work well after an easy session.", tags: ["vegetarian", "quick"] },
  { id: "chicken-pilau", title: "Chicken pilau", plate: "Chicken pilau with kachumbari", reason: "A Coast-rooted rice plate that is familiar far beyond the coast.", tags: ["chicken"] },
  { id: "rice-beef-cabbage", title: "Rice, beef stew & cabbage", plate: "Rice, beef stew and sautéed cabbage", reason: "The straightforward local-hotel plate when you want no fuss.", tags: ["meat"] },
  { id: "kamande-rice", title: "Kamande & rice", plate: "Kamande stew, rice and kachumbari", reason: "A warm legume plate with a fresh, bright side.", tags: ["vegetarian"] },
  { id: "chai-eggs-sweet-potato", title: "Chai, eggs & sweet potatoes", plate: "Chai ya tangawizi, eggs and boiled sweet potatoes", reason: "A lighter option for a gentler session or early start.", tags: ["quick"] },
];

export function selectRefuel(excludeIds: string[] = []): RefuelDetail {
  const candidates = REFUEL_CATALOG.filter((dish) => !excludeIds.includes(dish.id));
  const pool = candidates.length ? candidates : REFUEL_CATALOG;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function refuelIdsFromSessions(sessions: Array<Session | null | undefined>): string[] {
  return sessions.flatMap((session) => session?.refuelDetail?.id ? [session.refuelDetail.id] : []);
}

/** Coach's margin notes with Kenyan training culture. */
export const MARGIN_NOTES = [
  "Fisi Club energy — the pack keeps you honest.",
  "Hash Harriers rule one: no excuses before the run. Or after.",
  "The fastest runner on the trail is whoever shows up. Show up.",
  "Slow is smooth, smooth is fast. Don't rush the warm-up.",
  "Kasarani stands are quiet this time of day. Perfect.",
];
