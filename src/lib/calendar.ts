import type { Session } from "./types";

function escapeICS(value: string) { return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n"); }
function stamp(date: Date) { return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); }

/** Build a portable calendar file using the current week's local plan. */
export function planToICS(plan: Record<string, Session>): string {
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  const events = Object.entries(plan).map(([slot, session], index) => {
    const [day, when] = slot.split("-");
    const start = new Date(monday);
    start.setDate(monday.getDate() + Number(day));
    start.setHours(when === "am" ? 7 : 18, 0, 0, 0);
    const end = new Date(start.getTime() + session.minutes * 60_000);
    return ["BEGIN:VEVENT", `UID:${escapeICS(session.id)}-${slot}@gymandtonic`, `DTSTAMP:${stamp(now)}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`, `SUMMARY:${escapeICS(session.title)}`, `DESCRIPTION:${escapeICS(`${session.focus} · ${session.intensity} · ${session.minutes} minutes`)}`, `SEQUENCE:${index}`, "END:VEVENT"].join("\r\n");
  });
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Gym & Tonic//Weekly Plan//EN", "CALSCALE:GREGORIAN", ...events, "END:VCALENDAR", ""].join("\r\n");
}
