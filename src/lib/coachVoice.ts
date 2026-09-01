// The Coach Voice: maps plan events to warm, witty narration lines.
// Deterministic per (kind, focus, detail) so replays are stable.

export interface VoiceEvent {
  kind: "place" | "clear" | "approve" | "reject" | "swap" | "connect" | "complete" | "uncomplete" | "note" | "review" | "workout-start" | "workout-abandon";
  focus?: string;
  by?: "player" | "agent" | "system";
  detail?: string;
}

const POOLS: Record<string, string[]> = {
  "place:legs:player": [
    "Wheel Day on the board. Your future self just exhaled.",
    "Legs. The one day you can't skip twice.",
    "Squats booked. Bring your serious face.",
  ],
  "place:push:player": ["Press day. Shoulders will write about this.", "Push session in. Chest gets its flowers."],
  "place:pull:player": ["Pull day locked. Grip it and rip it.", "Rows and pulls — posture's best friends."],
  "place:core:player": ["Core work in. Quiet muscles, loud results."],
  "place:cardio:player": [
    "Engine work booked. Zone two, gossip pace.",
    "Cardio on the board. Lungs, you're welcome.",
  ],
  "place:mobility:player": ["Mobility flow slotted. Oil the hinges."],
  "place:default": ["Another session on the grid. The week takes shape."],
  clear: [
    "Rest day. That's not skipping — that's programming.",
    "Recovery booked. Muscle is built while you do nothing, famously.",
  ],
  swap: ["A little shuffle. The week bends so you don't break."],
  approve: ["Good call. Into the programme."],
  reject: ["Fair. Not every suggestion deserves the board."],
  connect: [
    "Your coach just walked in — kit on, whistle ready.",
    "Partner connected. Nine tools, zero excuses.",
  ],
  complete: ["Session complete. That counts.", "Done is a training style. Nicely played."],
  uncomplete: ["No drama. Adjust the record and keep the week honest."],
  note: ["Noted. Your future plan has better information now."],
  review: ["A quick look back makes the next week smarter."],
  "workout-start": ["Workout mode on. One movement at a time.", "Good. Start where your feet are."],
  "workout-abandon": ["Paused, not lost. Your place is saved for later."],
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function coachLine(ev: VoiceEvent): string {
  const by = ev.by ?? "player";

  if (ev.kind === "connect") return pick(POOLS.connect, ev.detail ?? "connect");
  if (ev.kind === "clear") return pick(POOLS.clear, ev.detail ?? "rest");
  if (ev.kind === "swap") return pick(POOLS.swap, ev.detail ?? "swap");
  if (ev.kind === "approve") return pick(POOLS.approve, ev.detail ?? "ok");
  if (ev.kind === "reject") return pick(POOLS.reject, ev.detail ?? "no");
  if (ev.kind === "complete") return pick(POOLS.complete, ev.detail ?? "done");
  if (ev.kind === "uncomplete") return pick(POOLS.uncomplete, ev.detail ?? "undo");
  if (ev.kind === "note") return pick(POOLS.note, ev.detail ?? "note");
  if (ev.kind === "review") return pick(POOLS.review, ev.detail ?? "review");
  if (ev.kind === "workout-start") return pick(POOLS["workout-start"], ev.detail ?? "start");
  if (ev.kind === "workout-abandon") return pick(POOLS["workout-abandon"], ev.detail ?? "pause");

  // place
  if (by === "agent") {
    return `Your coach slides a ${ev.focus ?? "training"} session across the table.`;
  }
  if (ev.focus && POOLS[`place:${ev.focus}:${by}`]) {
    return pick(POOLS[`place:${ev.focus}:${by}`], ev.detail ?? ev.focus);
  }
  return pick(POOLS["place:default"], ev.detail ?? "place");

  function pick(pool: string[], seedKey: string): string {
    return pool[hash(seedKey + pool.length) % pool.length];
  }
}
