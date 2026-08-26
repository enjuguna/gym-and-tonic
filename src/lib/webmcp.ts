// Cold Case WebMCP layer — 9 site tools for the player's AI partner.
// Read tools surface case content; write tools stage proposals the player
// approves on the corkboard. The agent can never accuse — only request review.

import { useBoard, LAUNCH_CASE } from "./store";
import {
  searchCase,
  readItem,
  crossReference,
  contradictionsInvolving,
  suspectDossiers,
} from "./caseEngine";

type Exec<T> = (args: any) => unknown;

interface Spec {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  readOnly?: boolean;
}

const SPECS: Array<Spec & { execute: Exec<any> }> = [];

function tool<T>(spec: Spec, execute: Exec<T>): Spec & { execute: Exec<T> } {
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

const CASE_ID = { type: "string", description: "Case id. Use 'vigil-karura-house'." };

// ── read tools ────────────────────────────────────────────────────────────

export const getCaseBriefingTool = tool<Record<string, never>>(
  {
    name: "get_case_briefing",
    title: "Get case briefing",
    description:
      "Returns the case intro: victim, location, date, and the full briefing narrative. Call this first to orient before searching evidence.",
    inputSchema: obj({ caseId: CASE_ID }, ["caseId"]),
    readOnly: true,
  },
  ({ caseId }: { caseId: string }) => {
    if (caseId !== LAUNCH_CASE.id) return { error: `Unknown case '${caseId}'. Available: ${LAUNCH_CASE.id}` };
    const { solution, ...rest } = LAUNCH_CASE as any;
    void solution; // never expose the solution to the agent!
    return rest;
  },
);

export const searchEvidenceTool = tool<{ query: string }>(
  {
    name: "search_evidence",
    title: "Search evidence",
    description:
      "Full-text search across all case evidence and suspect dossiers. Returns ranked hits with ids, kinds and excerpts. Use ids with read_evidence for full content.",
    inputSchema: obj({ caseId: CASE_ID, query: { type: "string", description: "Search terms, e.g. 'blackout veranda'." } }, ["caseId", "query"]),
    readOnly: true,
  },
  ({ caseId, query }: { caseId: string; query: string }) => {
    if (caseId !== LAUNCH_CASE.id) return { error: `Unknown case '${caseId}'.` };
    const hits = searchCase(LAUNCH_CASE, query);
    return { query, hitCount: hits.length, hits };
  },
);

export const readEvidenceTool = tool<{ itemId: string }>(
  {
    name: "read_evidence",
    title: "Read one item",
    description:
      "Returns the complete record of one item by id: an evidence piece (statement, log, document, physical object) or a suspect dossier. Always cite item ids when reasoning about them.",
    inputSchema: obj({ caseId: CASE_ID, itemId: { type: "string" } }, ["caseId", "itemId"]),
    readOnly: true,
  },
  ({ caseId, itemId }: { caseId: string; itemId: string }) => {
    if (caseId !== LAUNCH_CASE.id) return { error: `Unknown case '${caseId}'.` };
    const item = readItem(LAUNCH_CASE, itemId);
    if (!item) return { error: `No evidence or suspect with id '${itemId}'. Try search_evidence first.` };
    return item;
  },
);

export const listSuspectsTool = tool<Record<string, never>>(
  {
    name: "list_suspects",
    title: "List suspects",
    description:
      "Returns all suspects' dossiers: name, role, alibi, motive, relationship to the victim.",
    inputSchema: obj({ caseId: CASE_ID }, ["caseId"]),
    readOnly: true,
  },
  ({ caseId }: { caseId: string }) => {
    if (caseId !== LAUNCH_CASE.id) return { error: `Unknown case '${caseId}'.` };
    return { count: LAUNCH_CASE.suspects.length, suspects: suspectDossiers(LAUNCH_CASE) };
  },
);

export const crossReferenceTool = tool<{ itemIds: string[] }>(
  {
    name: "cross_reference",
    title: "Cross-reference items",
    description:
      "Compares two or more evidence items/suspects and returns detected contradictions between them, with summaries. This is how you verify alibis against logs. Also returns anything else in the case these items contradict.",
    inputSchema: obj(
      {
        caseId: CASE_ID,
        itemIds: { type: "array", items: { type: "string" }, minItems: 2, description: "Two or more evidence/suspect ids." },
      },
      ["caseId", "itemIds"],
    ),
    readOnly: true,
  },
  ({ caseId, itemIds }: { caseId: string; itemIds: string[] }) => {
    if (caseId !== LAUNCH_CASE.id) return { error: `Unknown case '${caseId}'.` };
    const among = crossReference(LAUNCH_CASE, itemIds);
    const involving = contradictionsInvolving(LAUNCH_CASE, itemIds).filter(
      (c) => !among.some((a) => a.id === c.id),
    );
    return {
      checkedPairCount: (itemIds.length * (itemIds.length - 1)) / 2,
      directContradictions: among,
      relatedContradictions: involving,
      hint: among.length || involving.length ? "Cite the item ids when pinning or theorising about these." : undefined,
    };
  },
);

// ── write tools (proposal pipeline) ──────────────────────────────────────

const board = () => useBoard.getState();

export const pinEvidenceTool = tool<{ itemId: string; reason: string }>(
  {
    name: "pin_evidence",
    title: "Pin evidence to board",
    description:
      "Pins an evidence card or suspect dossier onto the shared corkboard. The pin is staged as a pending proposal — the player must approve before it appears. Always state your reason; pins without clear investigative purpose will be rejected by the player.",
    inputSchema: obj({ caseId: CASE_ID, itemId: { type: "string" }, reason: { type: "string" } }, ["caseId", "itemId", "reason"]),
  },
  ({ caseId, itemId, reason }: { caseId: string; itemId: string; reason: string }) => {
    if (caseId !== LAUNCH_CASE.id) return { error: `Unknown case '${caseId}'.` };
    if (!readItem(LAUNCH_CASE, itemId)) return { error: `No such item '${itemId}'.` };
    if (!reason.trim()) return { error: "Give an investigative reason for the pin." };
    const id = board().applyProposal({ kind: "pin", summary: reason, toolSource: "pin_evidence", payload: { itemId, note: reason } as any, });
    return { proposalId: id, status: "pending-player-approval" };
  },
);

export const addNoteTool = tool<{ pinItemId: string; text: string }>(
  {
    name: "add_note",
    title: "Add note to pinned card",
    description:
      "Attaches an annotation to an already-pinned item (give the pinned item's id). Staged for player approval. Use for timeline reconstructions, open questions, or links between cards.",
    inputSchema: obj({ caseId: CASE_ID, pinItemId: { type: "string" }, text: { type: "string" } }, ["caseId", "pinItemId", "text"]),
  },
  ({ pinItemId, text }: { pinItemId: string; text: string }) => {
    const b = board();
    const pin = b.pins.find((p) => p.itemId === pinItemId);
    if (!pin) return { error: `Item '${pinItemId}' is not pinned yet. Ask to pin_evidence first.` };
    const id = b.applyProposal({
      kind: "note",
      summary: text,
      toolSource: "add_note",
      payload: { pinId: pin.id, text },
    });
    return { proposalId: id, status: "pending-player-approval" };
  },
);

export const proposeTheoryTool = tool<{ claim: string; supportingEvidenceIds: string[]; openQuestions?: string[] }>(
  {
    name: "propose_theory",
    title: "Propose theory card",
    description:
      "Stages a theory card on the board: your claim, the evidence ids that support it, and any open questions. The player accepts, challenges, or retracts it. Theories must cite at least two pieces of evidence — speculation without citations is not detective work.",
    inputSchema: obj(
      {
        caseId: CASE_ID,
        claim: { type: "string", description: "One-sentence theory, e.g. 'The poison was in the medication, not the tea.'" },
        supportingEvidenceIds: { type: "array", items: { type: "string" }, minItems: 2 },
        openQuestions: { type: "array", items: { type: "string" } },
      },
      ["caseId", "claim", "supportingEvidenceIds"],
    ),
  },
  ({ claim, supportingEvidenceIds }: { claim: string; supportingEvidenceIds: string[]; openQuestions?: string[] }) => {
    const invalid = supportingEvidenceIds.filter((eid) => !readItem(LAUNCH_CASE, eid));
    if (invalid.length) return { error: `Unknown evidence ids: ${invalid.join(", ")}.` };
    const id = board().applyProposal({
      kind: "theory",
      summary: claim,
      toolSource: "propose_theory",
      payload: { claim, evidenceIds: supportingEvidenceIds, openQuestions: [] },
    });
    return { proposalId: id, status: "pending-player-approval" };
  },
);

export const requestAccusationReviewTool = tool<{ suspectId: string; reasoning: string }>(
  {
    name: "request_accusation_review",
    title: "Request accusation review",
    description:
      "When you believe the evidence is sufficient, request that the PLAYER consider accusing a suspect. You cannot accuse anyone yourself — this tool stages a formal recommendation with your reasoning, and the player alone decides whether to end the game with an accusation.",
    inputSchema: obj({ caseId: CASE_ID, suspectId: { type: "string" }, reasoning: { type: "string" } }, ["caseId", "suspectId", "reasoning"]),
  },
  ({ caseId, suspectId, reasoning }: { caseId: string; suspectId: string; reasoning: string }) => {
    if (caseId !== LAUNCH_CASE.id) return { error: `Unknown case '${caseId}'.` };
    const s = LAUNCH_CASE.suspects.find((x) => x.id === suspectId);
    if (!s) return { error: `Unknown suspect '${suspectId}'.` };
    const id = board().applyProposal({
      kind: "review-request",
      summary: `Recommend the player consider accusing ${s.name}: ${reasoning}`,
      toolSource: "request_accusation_review",
      payload: { suspectId },
    });
    return {
      proposalId: id,
      status: "pending-player-decision",
      note: "The player decides alone whether to accuse. Do not pressure them.",
    };
  },
);

// ── registration ─────────────────────────────────────────────────────────

export interface WebMCPStatus {
  supported: boolean;
  registered: number;
}

export async function registerAllTools(): Promise<WebMCPStatus> {
  const mc = (
    document as unknown as {
      modelContext?: { registerTool: (t: object) => Promise<unknown> };
    }
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
        execute: (args: unknown) => (spec.execute as (a: unknown) => unknown)(args),
      });
      registered++;
    } catch (err) {
      console.error(`[cold-case] failed to register ${spec.name}`, err);
    }
  }
  return { supported: true, registered };
}

export function toolSpecs() {
  return SPECS.map(({ name, title, description, inputSchema, readOnly }) => ({
    name,
    title,
    description,
    inputSchema,
    readOnly: !!readOnly,
  }));
}
