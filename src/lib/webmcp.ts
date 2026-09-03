// Gym & Tonic WebMCP layer — 17 coach tools.
// Read tools inspect the week; write tools stage proposals for approval.

import { usePlan, DAYS } from "./store";
import { EXERCISES, balanceCheck, gearList, generateSession, exerciseById } from "./coach";
import { adaptiveGuidance, loadHistory, overloadCheck, progressReport } from "./history";
import { REFUEL_CATALOG, refuelIdsFromSessions } from "./kenyanFlavor";
import { loadTracking } from "./tracking";
import { loadTemplates } from "./templates";
import { planToICS } from "./calendar";
import type { Session, Slot } from "./types";

type Exec = (args: unknown) => unknown;

interface Spec {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  readOnly?: boolean;
}

const SPECS: Array<Spec & { execute: Exec }> = [];

function tool<T>(spec: Spec, execute: (args: T) => unknown): Spec & { execute: Exec } {
  const registered = {
    ...spec,
    execute: (args: unknown) => {
      try {
        return execute(args as T);
      } catch {
        return { error: "Invalid tool arguments." };
      }
    },
  };
  SPECS.push(registered);
  return registered;
}

const obj = (props: Record<string, unknown>, required: string[] = []) => ({
  type: "object",
  properties: props,
  required,
  additionalProperties: false,
});

// ── read tools ────────────────────────────────────────────────────────────

export const getWeekPlanTool = tool(
  {
    name: "get_week_plan",
    title: "Get week plan",
    description:
      "Returns the current training week: every filled slot (day 0-6 = Mon-Sun, am/pm) with session title, focus group, intensity and minutes. Call first to orient.",
    inputSchema: obj({}),
    readOnly: true,
  },
  () => {
    const { plan, preferences, completions } = usePlan.getState();
    const slots = Object.entries(plan).map(([slot, s]) => ({
      slot,
      day: DAYS[Number(slot.split("-")[0])],
      when: slot.split("-")[1],
      title: s.title,
      focus: s.focus,
      intensity: s.intensity,
      minutes: s.minutes,
      completed: !!completions[slot as Slot],
      completion: completions[slot as Slot],
    }));
    return { plannedCount: slots.length, ofTotal: 14, emptySlots: 14 - slots.length, preferences, slots };
  },
);

export const listExercisesTool = tool(
  {
    name: "list_exercises",
    title: "List exercises",
    description:
      "Exercise catalogue filtered by muscle group (legs/push/pull/core/cardio/mobility) or equipment. Returns ids for read_exercise and propose_session.",
    inputSchema: obj({
      group: { type: "string", enum: ["legs", "push", "pull", "core", "cardio", "mobility"] },
      equipment: { type: "string", description: "Filter to exercises usable with this equipment, e.g. 'barbell'." },
    }),
    readOnly: true,
  },
  ({ group, equipment }: { group?: string; equipment?: string }) => {
    let rows = EXERCISES;
    if (group) rows = rows.filter((e) => e.group === group);
    if (equipment) rows = rows.filter((e) => e.equipment.includes(equipment));
    return { count: rows.length, exercises: rows.map(({ id, name, group: g, duration, equipment: eq }) => ({ id, name, group: g, duration, equipment: eq })) };
  },
);

export const readExerciseTool = tool(
  {
    name: "read_exercise",
    title: "Read exercise",
    description: "Full entry for one exercise id: form cues, duration, required equipment.",
    inputSchema: obj({ exerciseId: { type: "string" } }, ["exerciseId"]),
    readOnly: true,
  },
  ({ exerciseId }: { exerciseId: string }) => {
    const ex = exerciseById(exerciseId);
    if (!ex) return { error: `No exercise '${exerciseId}'. Use list_exercises.` };
    return ex;
  },
);

export const checkBalanceTool = tool(
  {
    name: "check_balance",
    title: "Check weekly balance",
    description:
      "Minutes per muscle group this week, neglected groups, and a verdict with attitude. Use it before proposing sessions so the week ends up balanced.",
    inputSchema: obj({}),
    readOnly: true,
  },
  () => {
    const plan = usePlan.getState().plan;
    const r = balanceCheck(Object.values(plan));
    return r;
  },
);

export const aggregateGearTool = tool(
  {
    name: "aggregate_gear",
    title: "Aggregate gear list",
    description: "One deduplicated equipment list across all planned sessions — the gym-bag checklist.",
    inputSchema: obj({}),
    readOnly: true,
  },
  () => {
    const gear = gearList(Object.values(usePlan.getState().plan));
    return { items: Object.entries(gear).map(([item, uses]) => ({ item, uses })) };
  },
);

export const suggestSessionTool = tool(
  {
    name: "suggest_session",
    title: "Suggest a session",
    description:
      "Generates a session for a focus group without touching the board. Returns the full session object; use propose_session to actually place it.",
    inputSchema: obj(
      {
        focus: { type: "string", enum: ["legs", "push", "pull", "core", "cardio", "mobility"] },
        intensity: { type: "string", enum: ["light", "moderate", "brutal"] },
      },
      ["focus"],
    ),
    readOnly: true,
  },
  ({ focus, intensity }: { focus: Session["focus"]; intensity?: Session["intensity"] }) =>
    generateSession(focus, intensity ?? "moderate", { excludeRefuelIds: refuelIdsFromSessions(Object.values(usePlan.getState().plan)) }),
);

// ── proposal tools ────────────────────────────────────────────────────────

const FOCUS = ["legs", "push", "pull", "core", "cardio", "mobility"] as const;

export const proposeSessionTool = tool(
  {
    name: "propose_session",
    title: "Propose session into a slot",
    description:
      "Stages placing a session into an empty slot (format '0-am'..'6-pm', day 0=Mon). Pending until the player approves on the grid. Prefer suggesting refuels too via the session's refuel field.",
    inputSchema: obj(
      {
        slot: { type: "string", pattern: "^[0-6]-(am|pm)$" },
        focus: { type: "string", enum: [...FOCUS] },
        intensity: { type: "string", enum: ["light", "moderate", "brutal"] },
        summary: { type: "string", description: "Why this session here, e.g. 'Legs are neglected by Wednesday.'" },
      },
      ["slot", "focus", "summary"],
    ),
  },
  ({ slot, focus, intensity, summary }: { slot: string; focus: Session["focus"]; intensity?: Session["intensity"]; summary: string }) => {
    const [d] = slot.split("-");
    if (Number(d) > 6 || !slot.endsWith("am") && !slot.endsWith("pm")) return { error: `Slot '${slot}' invalid. Format '0-am'..'6-pm'.` };
    const existing = usePlan.getState().plan[slot];
    const session = generateSession(focus, intensity ?? "moderate", { excludeRefuelIds: refuelIdsFromSessions(Object.values(usePlan.getState().plan)) });
    const id = usePlan.getState().applyProposal({
      summary,
      toolSource: "propose_session",
      payload: { kind: "place", slot: slot as Slot, session },
    });
    return {
      proposalId: id,
      status: "pending-player-approval",
      replacingExisting: !!existing,
      session: { title: session.title, minutes: session.minutes, exercises: session.exercises.map((e) => exerciseById(e)?.name), refuel: session.refuel, refuelDetail: session.refuelDetail },
    };
  },
);

export const swapSessionsTool = tool(
  {
    name: "swap_sessions",
    title: "Swap two sessions",
    description: "Proposes exchanging the contents of two occupied slots. Staged for approval.",
    inputSchema: obj(
      { slotA: { type: "string" }, slotB: { type: "string" }, summary: { type: "string" } },
      ["slotA", "slotB", "summary"],
    ),
  },
  ({ slotA, slotB, summary }: { slotA: string; slotB: string; summary: string }) => {
    const plan = usePlan.getState().plan;
    if (!plan[slotA]) return { error: `Slot ${slotA} is empty — use propose_session instead.` };
    if (!plan[slotB]) return { error: `Slot ${slotB} is empty — use propose_session instead.` };
    const id = usePlan.getState().applyProposal({
      summary,
      toolSource: "swap_sessions",
      payload: { kind: "swap", slotA: slotA as Slot, slotB: slotB as Slot, sessionA: plan[slotA], sessionB: plan[slotB] },
    });
    return { proposalId: id, status: "pending-player-approval" };
  },
);

export const clearSlotTool = tool(
  {
    name: "clear_slot",
    title: "Propose rest day",
    description:
      "Proposes clearing a slot — rest is programming too. Staged for player approval with their reason attached.",
    inputSchema: obj({ slot: { type: "string" }, summary: { type: "string" } }, ["slot", "summary"]),
  },
  ({ slot, summary }: { slot: string; summary: string }) => {
    if (!usePlan.getState().plan[slot]) return { error: `Slot ${slot} is already empty.` };
    const id = usePlan.getState().applyProposal({ summary, toolSource: "clear_slot", payload: { kind: "clear", slot: slot as Slot, session: usePlan.getState().plan[slot] } });
    return { proposalId: id, status: "pending-player-approval" };
  },
);

export const fillWeekTool = tool(
  {
    name: "fill_week",
    title: "Propose a full week",
    description:
      "Analyzes balance, then stages ONE proposal that fills every empty weekday-evening slot (Mon-Fri PM) with sessions chosen to cover neglected muscle groups. The player approves or rejects the whole week at once. Prefer check_balance first so your summary explains the choices.",
    inputSchema: obj({ summary: { type: "string", description: "Your reasoning, e.g. 'Legs and cardio are neglected — filled with those.'" } }, ["summary"]),
  },
  ({ summary }: { summary: string }) => {
    const plan = usePlan.getState().plan;
    const empty = [0, 1, 2, 3, 4].map((d) => `${d}-pm` as const).filter((s) => !(s as string in plan));
    if (!empty.length) return { error: "Week is already full (Mon–Fri PM)." };
    // choose focuses for the most-neglected groups
    const r = balanceCheck(Object.values(plan));
    const neglectedFirst = [...r.neglected, ...FOCUS].filter(
      (g, i, arr) => arr.indexOf(g) === i,
    );
    const usedRefuelIds = refuelIdsFromSessions(Object.values(plan));
    const fills = empty.map((slot, i) => {
      const session = generateSession(neglectedFirst[i % neglectedFirst.length] as Session["focus"], "moderate", { excludeRefuelIds: usedRefuelIds });
      if (session.refuelDetail) usedRefuelIds.push(session.refuelDetail.id);
      return { slot: slot as Slot, session };
    });
    const id = usePlan.getState().applyProposal({
      summary,
      toolSource: "fill_week",
      payload: { kind: "fill-week", fills },
    });
    return {
      proposalId: id,
      status: "pending-player-approval",
      slotsFilled: fills.length,
      breakdown: fills.map((f) => ({ slot: f.slot, focus: f.session.focus, title: f.session.title })),
    };
  },
);

export const overloadReportTool = tool(
  {
    name: "overload_report",
    title: "Progressive-overload report",
    description:
      "Compares this week's minutes per muscle group against recorded history (previous weeks stored on-device). Returns per-group deltas with advice and a headline. Use it to ground progression claims before proposing sessions.",
    inputSchema: obj({}),
    readOnly: true,
  },
  () => {
    let hist: { weekKey: string; sessions: Session[]; completedAt: number }[] = [];
    try {
      hist = JSON.parse(localStorage.getItem("gt_history") ?? "[]");
    } catch { /* none */ }
    // overloadCheck is a pure function over (thisWeek, history) — reuse it.
    const plan = Object.values(usePlan.getState().plan);
    const r = overloadCheck(plan, hist);
    return { comparedAgainst: hist.length >= 2 ? hist[hist.length - 2].weekKey : undefined, ...r };
  },
);

export const getProgressTool = tool(
  {
    name: "get_progress",
    title: "Get training progress",
    description: "Returns planned versus completed sessions and minutes, consistency, streak, covered groups, and lightweight guidance.",
    inputSchema: obj({}),
    readOnly: true,
  },
  () => {
    const { plan, completions } = usePlan.getState();
    const report = progressReport(plan, completions, loadHistory());
    return { ...report, guidance: `${report.guidance} ${adaptiveGuidance(plan, completions)}` };
  },
);

export const getTrainingHistoryTool = tool(
  {
    name: "get_training_history",
    title: "Get completed training history",
    description: "Returns locally stored weekly training history, including planned sessions, completed sessions, minutes, and reflections.",
    inputSchema: obj({}),
    readOnly: true,
  },
  () => {
    const history = loadHistory();
    return { weeksTracked: history.length, weeks: history.map((week) => ({ ...week, completedCount: Object.keys(week.completions ?? {}).length })) };
  },
);

export const listTemplatesTool = tool(
  {
    name: "list_templates",
    title: "List saved week templates",
    description: "Returns the locally saved weekly rhythms available to the player. Templates are never applied by an agent.",
    inputSchema: obj({}),
    readOnly: true,
  },
  () => ({ templates: loadTemplates().map((template) => ({ id: template.id, name: template.name, sessionCount: Object.keys(template.plan).length, createdAt: template.createdAt })) }),
);

export const getCalendarPlanTool = tool(
  {
    name: "get_calendar_plan",
    title: "Prepare calendar plan",
    description: "Returns the current planned sessions as calendar-ready event details and an iCalendar export string. It does not create or send calendar events.",
    inputSchema: obj({}),
    readOnly: true,
  },
  () => {
    const plan = usePlan.getState().plan;
    const events = Object.entries(plan).map(([slot, session]) => ({ slot, title: session.title, focus: session.focus, intensity: session.intensity, minutes: session.minutes }));
    return { eventCount: events.length, events, ics: planToICS(plan) };
  },
);

export const getFitnessPreferencesTool = tool(
  {
    name: "get_fitness_preferences",
    title: "Get fitness preferences",
    description: "Returns non-sensitive fitness preferences so a coach can tailor suggestions. Private weight entries are never included.",
    inputSchema: obj({}),
    readOnly: true,
  },
  () => {
    const { goal, dietaryPreference, weightUnit, selectedHabits } = loadTracking();
    const { preferences } = usePlan.getState();
    return { goal: goal ?? preferences.goal ?? "general-fitness", dietaryPreference, weightUnit, selectedHabits, duration: preferences.duration, equipment: preferences.equipment, intensity: preferences.intensity };
  },
);

export const listMealIdeasTool = tool(
  {
    name: "list_meal_ideas",
    title: "List meal ideas",
    description: "Returns shared meal ideas filtered by a dietary preference or search term. Suggestions are informational and contain no personal food log.",
    inputSchema: obj({ dietaryPreference: { type: "string", enum: ["omnivore", "vegetarian", "vegan", "pescatarian"] }, search: { type: "string" } }),
    readOnly: true,
  },
  ({ dietaryPreference, search }: { dietaryPreference?: string; search?: string }) => {
    const query = (search ?? "").toLowerCase();
    const meals = REFUEL_CATALOG.filter((meal) => `${meal.title} ${meal.plate}`.toLowerCase().includes(query) && (dietaryPreference === undefined || dietaryPreference === "omnivore" || meal.tags.includes(dietaryPreference === "vegetarian" && meal.tags.includes("vegan") ? "vegan" : dietaryPreference as never)));
    return { count: meals.length, meals };
  },
);

// ── registration ─────────────────────────────────────────────────────────

export interface WebMCPStatus {
  supported: boolean;
  registered: number;
}

export async function registerAllTools(): Promise<WebMCPStatus> {
  const mc = (
    document as unknown as { modelContext?: { registerTool: (t: object) => Promise<unknown> } }
  ).modelContext;
  if (!mc?.registerTool) return { supported: false, registered: 0 };

  // Astro/Vite can remount this island during local edits. Keep successful
  // registrations on the document so an HMR pass does not try to add the
  // same WebMCP name a second time.
  const registryDocument = document as Document & { __gtRegisteredTools?: Set<string> };
  const registeredNames = registryDocument.__gtRegisteredTools ?? new Set<string>();
  registryDocument.__gtRegisteredTools = registeredNames;
  let registered = 0;
  for (const spec of SPECS) {
    if (registeredNames.has(spec.name)) {
      registered++;
      continue;
    }
    try {
      await mc.registerTool({
        name: spec.name,
        title: spec.title,
        description: spec.description,
        inputSchema: spec.inputSchema,
        annotations: spec.readOnly ? { readOnlyHint: true } : {},
        execute: (args: unknown) => spec.execute(args),
      });
      registeredNames.add(spec.name);
      registered++;
    } catch (err) {
      console.error(`[gym-and-tonic] failed to register ${spec.name}`, err);
    }
  }
  return { supported: true, registered };
}

export function toolSpecs() {
  return SPECS.map(({ name, title, description, inputSchema, readOnly }) => ({
    name, title, description, inputSchema, readOnly: !!readOnly,
  }));
}
