// Narrator: maps board events to atmospheric narration lines.
// Deterministic per event so replays are stable.

type Ev =
  | { type: "pin"; itemId: string; by: "player" | "agent" }
  | { type: "approve"; kind: string }
  | { type: "reject"; kind: string }
  | { type: "contradiction"; id: string }
  | { type: "theory"; status: string };

const LINES: Record<string, string[]> = {
  "pin:ev-chai-flask": [
    "The flask. Her prints alone — and she made sure everyone watched her carry it.",
    "Warm chai, cold trail. Whoever dosed him never touched the tea.",
  ],
  "pin:ev-taxi-receipt": [
    "Twenty past eight. The rain had not started. Wanda was already gone.",
  ],
  "pin:ev-med-bottle": [
    "Tool marks on the cap. Someone opened this who wasn't Charles.",
  ],
  "pin:ev-pharmacy-log": [
    "Collected two days early, under her name — and never mentioned. Curious.",
  ],
  "pin:ev-grace-statement": [
    "Read it again. Her alibi needs another person in the room.",
  ],
  "pin:ev-wanda-statement": [
    "She was home before nine. Remember that when someone says otherwise.",
  ],
  "pin:default": ["Another card for the board. The picture sharpens."],
  contradiction: [
    "There it is — the story wobbles. Press on the crack.",
  ],
  "theory:accepted": ["You nod slowly. That's the shape of it."],
  "theory:challenged": ["Not so fast. A mentalist never accepts the first answer."],
  reject: ["You let it pass. Instinct says nothing."],
  approve: ["Good. Into the record."],
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function narrate(ev: Ev): string {
  if (ev.type === "pin") {
    if (ev.by === "agent") {
      const agent = LINES[`pin:${ev.itemId}`];
      return agent
        ? `Your partner slides a card across: ${agent[hash(ev.itemId) % agent.length]}`
        : "Your partner suggests a card. Study it before you allow it.";
    }
    const specific = LINES[`pin:${ev.itemId}`];
    if (specific) return specific[hash(ev.itemId) % specific.length];
    return LINES["pin:default"][0];
  }
  if (ev.type === "contradiction") return LINES.contradiction[0];
  if (ev.type === "theory")
    return ev.status === "accepted"
      ? LINES["theory:accepted"][0]
      : LINES["theory:challenged"][0];
  return LINES[ev.type]?.[0] ?? "";
}
