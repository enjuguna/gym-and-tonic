// Shared everyday meal ideas. The filename remains for saved-plan compatibility.
import type { RefuelDetail, Session } from "./types";

export const GHOST_COPY = [
  "Start with what feels manageable.", "A little movement counts today.", "Keep the rhythm kind and steady.",
  "One useful session is enough to begin.", "Make the next choice easy.", "You can adjust the plan as life changes.",
  "A gentle session still moves the week forward.",
];

/** Time-aware greeting in the user's local time. */
export function greetingEat(hourLocal: number): { hello: string; hint: string } {
  if (hourLocal < 11) return { hello: "Good morning!", hint: "Ready for a manageable start?" };
  if (hourLocal < 17) return { hello: "Good afternoon,", hint: "there is still time to move." };
  return { hello: "Good evening!", hint: "A gentle plan still counts." };
}

/** Specific everyday plates from a range of food traditions. */
export const REFUEL_CATALOG: RefuelDetail[] = [
  { id: "rice-lentils-greens", title: "Rice, lentils & greens", plate: "Rice, lentils, cooked greens and avocado", reason: "A familiar balance of grains, legumes and vegetables.", tags: ["vegetarian"] },
  { id: "fish-potatoes-salad", title: "Fish, potatoes & salad", plate: "Grilled white fish, potatoes and a crisp salad", reason: "A simple fish plate with a filling side and fresh vegetables.", tags: ["fish"] },
  { id: "flatbread-bean-salad", title: "Flatbread, beans & salad", plate: "Wholegrain flatbread, bean stew and chopped salad", reason: "A quick meat-free plate with fibre and a fresh side.", tags: ["vegetarian", "quick"] },
  { id: "bean-corn-avocado", title: "Bean, corn & avocado salad", plate: "Beans, sweetcorn, avocado and tomato", reason: "A colourful plant-based combination that needs little preparation.", tags: ["vegan", "quick"] },
  { id: "chicken-grain-vegetables", title: "Chicken, grains & vegetables", plate: "Roasted chicken, grains and seasonal vegetables", reason: "A flexible plate with a clear protein and vegetable base.", tags: ["chicken"] },
  { id: "plantain-beef-greens", title: "Plantain, beef & greens", plate: "Baked plantain, lean beef and cooked greens", reason: "A warm, satisfying meal with a familiar starch and vegetables.", tags: ["meat"] },
  { id: "sardine-polenta-greens", title: "Sardines, polenta & greens", plate: "Sardines, soft polenta and sautéed greens", reason: "A practical fish meal with a soft grain and vegetables.", tags: ["fish"] },
  { id: "sweet-potato-chickpeas", title: "Sweet potato & chickpeas", plate: "Roasted sweet potato, chickpeas and spinach", reason: "Simple pantry staples make a useful plant-based plate.", tags: ["vegan", "quick"] },
  { id: "spiced-chicken-rice", title: "Spiced chicken & rice", plate: "Spiced chicken, rice and cucumber salad", reason: "A familiar rice plate that is easy to adjust to your kitchen.", tags: ["chicken"] },
  { id: "beef-rice-cabbage", title: "Beef, rice & cabbage", plate: "Lean beef stew, rice and sautéed cabbage", reason: "A straightforward hot meal when you want something filling.", tags: ["meat"] },
  { id: "lentil-rice-salsa", title: "Lentils, rice & salsa", plate: "Lentils, rice and a tomato-herb salsa", reason: "A warm legume plate with a bright, fresh finish.", tags: ["vegan"] },
  { id: "eggs-toast-fruit", title: "Eggs, toast & fruit", plate: "Eggs, wholegrain toast and seasonal fruit", reason: "A lighter option for an early start or gentler session.", tags: ["vegetarian", "quick"] },
  { id: "oats-yogurt-berries", title: "Oats, yogurt & berries", plate: "Oats with plain yogurt, berries and seeds", reason: "A quick mix of grains, fruit and a protein-rich food.", tags: ["vegetarian", "quick"] },
  { id: "bean-tacos-salsa", title: "Bean tacos & salsa", plate: "Soft tortillas, black beans, salsa and avocado", reason: "Beans and a fresh topping make a flexible meat-free plate.", tags: ["vegan", "quick"] },
  { id: "tofu-noodle-stir-fry", title: "Tofu noodle stir-fry", plate: "Tofu, noodles and mixed vegetables", reason: "A warm, adaptable plate for a busy evening.", tags: ["vegan"] },
  { id: "salmon-potatoes-greens", title: "Salmon, potatoes & greens", plate: "Baked salmon, potatoes and green vegetables", reason: "Fish, a familiar starch and vegetables in one simple meal.", tags: ["fish"] },
  { id: "chicken-rice-vegetables", title: "Chicken, rice & vegetables", plate: "Grilled chicken, rice and seasonal vegetables", reason: "A straightforward combination that is easy to adapt.", tags: ["chicken"] },
  { id: "lentil-curry-rice", title: "Lentil curry & rice", plate: "Lentil curry, rice and cucumber salad", reason: "Legumes, grains and a crisp side make a satisfying plate.", tags: ["vegan"] },
  { id: "tuna-potato-salad", title: "Tuna, potato & bean salad", plate: "Tuna, potatoes, green beans and lemon dressing", reason: "A practical cold meal with fish and vegetables.", tags: ["fish", "quick"] },
  { id: "egg-wholegrain-toast", title: "Eggs & wholegrain toast", plate: "Eggs, wholegrain toast and sliced tomato", reason: "A quick breakfast-style option for an early session.", tags: ["vegetarian", "quick"] },
  { id: "chickpea-couscous", title: "Chickpea couscous salad", plate: "Couscous, chickpeas, herbs and roasted vegetables", reason: "A make-ahead option with legumes and colourful vegetables.", tags: ["vegan"] },
  { id: "beef-vegetable-noodles", title: "Beef and vegetable noodles", plate: "Lean beef, noodles and stir-fried vegetables", reason: "A familiar hot meal with protein and plenty of vegetables.", tags: ["meat"] },
  { id: "quinoa-chicken-bowl", title: "Chicken quinoa salad", plate: "Chicken, quinoa, greens and a lemon dressing", reason: "A cool, flexible plate for a warm day.", tags: ["chicken"] },
  { id: "hummus-pita-salad", title: "Hummus, pita & salad", plate: "Hummus, wholegrain pita and chopped salad", reason: "A quick plant-based plate with grains and vegetables.", tags: ["vegan", "quick"] },
];

// Keep the catalogue useful in meal browsing as well as in session refuels.
REFUEL_CATALOG.forEach((meal, index) => {
  meal.prepMinutes ??= index % 3 === 0 ? 15 : 30;
  meal.ingredients ??= meal.plate.split(", ");
});

export function selectRefuel(excludeIds: string[] = []): RefuelDetail {
  const candidates = REFUEL_CATALOG.filter((dish) => !excludeIds.includes(dish.id));
  const pool = candidates.length ? candidates : REFUEL_CATALOG;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function refuelIdsFromSessions(sessions: Array<Session | null | undefined>): string[] {
  return sessions.flatMap((session) => session?.refuelDetail?.id ? [session.refuelDetail.id] : []);
}

/** Coach's short, globally understandable margin notes. */
export const MARGIN_NOTES = [
  "A little support makes showing up easier.",
  "Start gently. You can always build from there.",
  "The best pace is the one you can repeat.",
  "Slow is smooth. Give the warm-up its time.",
  "A quiet start is still a strong start.",
];
