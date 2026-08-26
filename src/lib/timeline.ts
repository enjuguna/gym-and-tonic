// Timeline reconstruction: orders evidence + claims into a chronology.

import type { CaseFile } from "./types";

export interface TimelineEvent {
  time: string; // sort key, e.g. "20:12" or "2026-07-09"
  label: string; // short description
  itemIds: string[]; // supporting evidence
}

const TIME_RE = /^\d{1,2}:\d{2}$/;

/** Build the night's chronology from every item with a time reference. */
export function buildTimeline(caseFile: CaseFile): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const ev of caseFile.evidence) {
    if (ev.time && ev.time.includes(":") && !/^\d{4}/.test(ev.time)) {
      events.push({ time: normalize(ev.time), label: `${ev.title}`, itemIds: [ev.id] });
    }
    for (const c of ev.claims ?? []) {
      if (c.atTime) {
        const who = c.subject.startsWith("sus-")
          ? caseFile.suspects.find((s) => s.id === c.subject)?.name ?? c.subject
          : c.subject;
        events.push({
          time: normalize(c.atTime),
          label: `${who} ${c.predicate.replace(/-/g, " ")} ${c.object.replace(/-/g, " ")}`,
          itemIds: [ev.id],
        });
      }
    }
  }

  // dedupe by time+label
  const seen = new Set<string>();
  return events
    .filter((e) => {
      const k = `${e.time}|${e.label}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
}

function normalize(t: string): string {
  t = t.trim();
  const m = t.match(/(\d{1,2}:\d{2})/);
  if (!m) return t;
  let [h, min] = m[1].split(":").map(Number);
  while (h > 23) h -= 24;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}
