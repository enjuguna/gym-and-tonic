import type { Session, SetupPreferences, Slot, WeekTemplate } from "./types";

const KEY = "gt_templates";
const VERSION = 1;

function validSession(value: unknown): value is Session {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<Session>;
  return typeof session.id === "string" && typeof session.title === "string" && typeof session.minutes === "number" && Array.isArray(session.exercises);
}

function validTemplate(value: unknown): value is WeekTemplate {
  if (!value || typeof value !== "object") return false;
  const template = value as Partial<WeekTemplate>;
  return typeof template.id === "string" && typeof template.name === "string" && !!template.plan && typeof template.plan === "object" && Object.entries(template.plan).every(([slot, session]) => /^(?:[0-6])-(?:am|pm)$/.test(slot) && validSession(session));
}

export function loadTemplates(): WeekTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) ?? "null") as { version?: number; templates?: unknown } | null;
    if (!raw || raw.version !== VERSION || !Array.isArray(raw.templates)) return [];
    return raw.templates.filter(validTemplate).slice(0, 12);
  } catch { return []; }
}

function persist(templates: WeekTemplate[]) {
  try { window.localStorage.setItem(KEY, JSON.stringify({ version: VERSION, templates: templates.slice(0, 12) })); } catch { /* private mode or storage quota */ }
}

export function saveTemplate(name: string, plan: Record<string, Session>, preferences: SetupPreferences): WeekTemplate | null {
  const sessions = Object.entries(plan).filter(([, session]) => validSession(session)).reduce<Partial<Record<Slot, Session>>>((out, [slot, session]) => { out[slot as Slot] = session; return out; }, {});
  if (!Object.keys(sessions).length) return null;
  const template: WeekTemplate = { id: `template-${Date.now()}`, name: name.trim().slice(0, 60) || "My usual week", plan: sessions, preferences, createdAt: Date.now() };
  persist([template, ...loadTemplates().filter((item) => item.name !== template.name)]);
  return template;
}

export function deleteTemplate(id: string) { persist(loadTemplates().filter((template) => template.id !== id)); }
