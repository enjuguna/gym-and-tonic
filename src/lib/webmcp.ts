// Gym & Tonic WebMCP layer — 9 coach tools.
// Read tools inspect the week; write tools stage proposals for approval.

import { usePlan, DAYS } from "./store";
import { EXERCISES, balanceCheck, gearList, generateSession, exerciseById } from "./coach";
import { overloadCheck } from "./history";
import type { Session } from "./types";

type Exec = (args: any) => unknown;

interface Spec {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  readOnly?: boolean;
}

const SPECS: Array<Spec & { execute: Exec }> = [];

function tool(spec: Spec, execute: Exec): Spec & { execute: Exec } {
  const registered = { ...spec, execute };
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
    const { plan, preferences } = usePlan.getState();
    const slots = Object.entries(plan).map(([slot, s]) => ({
      slot,
      day: DAYS[Number(slot.split("-")[0])],
      when: slot.split("-")[1],
      title: s.title,
      focus: s.focus,
      intensity: s.intensity,
      minutes: s.minutes,
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
    generateSession(focus, intensity ?? "moderate"),
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
    const session = generateSession(focus, intensity ?? "moderate");
    const id = usePlan.getState().applyProposal({
      kind: "place",
      summary,
      toolSource: "propose_session",
      payload: { slot, session },
    });
    return {
      proposalId: id,
      status: "pending-player-approval",
      replacingExisting: !!existing,
      session: { title: session.title, minutes: session.minutes, exercises: session.exercises.map((e) => exerciseById(e)?.name), refuel: session.refuel },
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
      kind: "place",
      summary,
      toolSource: "swap_sessions",
      // model a swap as two placements
      payload: { slot: slotA, session: plan[slotB], alsoPlace: { slot: slotB, session: plan[slotA] } },
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
    const id = usePlan.getState().applyProposal({ kind: "clear", summary, toolSource: "clear_slot", payload: { slot } });
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
    const fills = empty.map((slot, i) => ({
      slot,
      session: generateSession(neglectedFirst[i % neglectedFirst.length] as Session["focus"], "moderate"),
    }));
    const id = usePlan.getState().applyProposal({
      kind: "fill-week",
      summary,
      toolSource: "fill_week",
      payload: { fills },
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

  let registered = 0;
  for (const spec of SPECS) {
    try {
      await mc.registerTool({
        name: spec.name,
        title: spec.title,
        description: spec.description,
        inputSchema: spec.inputSchema,
        annotations: spec.readOnly ? { readOnlyHint: true } : {},
        execute: (args: unknown) => spec.execute(args),
      });
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
