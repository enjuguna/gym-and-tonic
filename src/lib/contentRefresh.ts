import { REFUEL_CATALOG } from "./kenyanFlavor";
import type { Session } from "./types";

export interface ContentRefreshChange {
  sessionId: string;
  fromTitle: string;
  toTitle: string;
  fromRefuel?: string;
  toRefuel: string;
}

// Compatibility-only mappings for plans created by earlier, place-specific
// versions. They intentionally match exact legacy copy and never touch notes,
// IDs, completions, dates, or active workout progress.
const TITLE_REFRESH: Record<string, string> = {
  "Push Past Westlands": "Upper Body Push",
  "Skip the Matatu Today": "Easy outdoor run",
  "Githeri Grind": "Steady Full Body",
};

const REFUEL_REFRESH: Record<string, string> = {
  "Githeri bowl": "Rice, lentils & greens",
  "Githeri Bowl": "Rice, lentils & greens",
};

export function refreshSessionContent(session: Session): { session: Session; changed: boolean } {
  const title = TITLE_REFRESH[session.title] ?? session.title;
  const refuelTitle = session.refuel ? REFUEL_REFRESH[session.refuel] : undefined;
  const detail = session.refuelDetail ?? (refuelTitle ? REFUEL_CATALOG.find((meal) => meal.title === refuelTitle) : undefined);
  if (title === session.title && !refuelTitle && detail === session.refuelDetail) return { session, changed: false };
  return {
    changed: true,
    session: {
      ...session,
      title,
      ...(detail ? { refuel: detail.title, refuelDetail: detail } : refuelTitle ? { refuel: refuelTitle } : {}),
    },
  };
}

export function previewContentRefresh(plan: Record<string, Session>): ContentRefreshChange[] {
  return Object.values(plan).flatMap((session) => {
    const result = refreshSessionContent(session);
    if (!result.changed) return [];
    return [{ sessionId: session.id, fromTitle: session.title, toTitle: result.session.title, fromRefuel: session.refuel, toRefuel: result.session.refuel ?? "" }];
  });
}

export function applyContentRefresh(plan: Record<string, Session>): Record<string, Session> {
  return Object.fromEntries(Object.entries(plan).map(([slot, session]) => [slot, refreshSessionContent(session).session]));
}
