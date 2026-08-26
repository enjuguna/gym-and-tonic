// Pure functions over CaseFile — search, citation extraction, contradiction detection.

import type { CaseFile, Evidence } from "./types";

/** Case-insensitive full-text search across evidence + suspects. Returns ranked hits. */
export function searchCase(caseFile: CaseFile, query: string): Array<{
  id: string;
  kind: string;
  title: string;
  excerpt: string;
}> {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const results: Array<{ id: string; kind: string; title: string; excerpt: string; score: number }> = [];

  for (const ev of caseFile.evidence) {
    const haystack = `${ev.title} ${ev.source ?? ""} ${ev.content}`.toLowerCase();
    let score = 0;
    for (const t of terms) {
      let idx = haystack.indexOf(t);
      while (idx !== -1) {
        score++;
        idx = haystack.indexOf(t, idx + t.length);
      }
    }
    if (score > 0) results.push({ id: ev.id, kind: ev.kind, title: ev.title, excerpt: excerpt(ev.content, terms), score });
  }
  for (const s of caseFile.suspects) {
    const haystack = `${s.name} ${s.role} ${s.alibi} ${s.motive} ${s.relationship}`.toLowerCase();
    let score = 0;
    for (const t of terms) if (haystack.includes(t)) score += 2;
    if (score > 0)
      results.push({
        id: s.id,
        kind: "suspect",
        title: `${s.name} (${s.role})`,
        excerpt: `Alibi: ${s.alibi} — Motive: ${s.motive}`,
        score,
      });
  }
  return results.sort((a, b) => b.score - a.score).slice(0, 10);
}

function excerpt(content: string, terms: string[]): string {
  const lower = content.toLowerCase();
  const first = terms.map((t) => lower.indexOf(t)).filter((i) => i >= 0).sort((a, b) => a - b)[0];
  if (first === undefined) return content.slice(0, 140);
  const start = Math.max(0, first - 60);
  return (start > 0 ? "…" : "") + content.slice(start, start + 180).trim() + (start + 180 < content.length ? "…" : "");
}

/** Full record of one item — evidence or suspect dossier. */
export function readItem(caseFile: CaseFile, id: string): unknown | null {
  const ev = caseFile.evidence.find((e) => e.id === id);
  if (ev) return { type: "evidence", ...ev };
  const s = caseFile.suspects.find((x) => x.id === id);
  if (s) return { type: "suspect", id: s.id, name: s.name, role: s.role, alibi: s.alibi, motive: s.motive, relationship: s.relationship };
  return null;
}

/** Compare any set of evidence/suspects and return authored contradictions among them. */
export function crossReference(
  caseFile: CaseFile,
  ids: string[],
): Array<{ id: string; aId: string; bId: string; summary: string }> {
  const wanted = new Set(ids);
  return caseFile.contradictions
    .filter((c) => wanted.has(c.aId) && wanted.has(c.bId))
    .map(({ id, aId, bId, summary }) => ({ id, aId, bId, summary }));
}

/** All contradictions involving anything in `ids` on either side. */
export function contradictionsInvolving(caseFile: CaseFile, ids: string[]): ReturnType<typeof crossReference> {
  const wanted = new Set(ids);
  return caseFile.contradictions.filter((c) => wanted.has(c.aId) || wanted.has(c.bId));
}

export function suspectDossiers(caseFile: CaseFile) {
  return caseFile.suspects.map((s) => ({
    id: s.id, name: s.name, role: s.role, alibi: s.alibi, motive: s.motive, relationship: s.relationship,
  }));
}

/** Epilogue scoring — called only at accusation time. */
export function scoreAccusation(
  caseFile: CaseFile,
  accusedId: string,
  citedEvidenceIds: string[],
): {
  correct: boolean;
  culpritName: string;
  explanation: string;
  keyEvidenceFound: string[];
  redHerringsChased: string[];
  deductionScore: number; // 0-100
} {
  const sol = caseFile.solution;
  const culprit = caseFile.suspects.find((s) => s.id === sol.culpritId)!;
  const citedSet = new Set(citedEvidenceIds);
  const keyFound = sol.keyEvidence.filter((e) => citedSet.has(e));
  const herrings = caseFile.suspects
    .filter((s) => sol.redHerringSuspects.includes(s.id))
    .map((s) => s.name);
  const correct = accusedId === sol.culpritId;
  const base = correct ? 60 : 15;
  const chainBonus = Math.round((keyFound.length / sol.keyEvidence.length) * 40);
  return {
    correct,
    culpritName: culprit.name,
    explanation: sol.explanation,
    keyEvidenceFound: keyFound,
    redHerringsChased: herrings,
    deductionScore: Math.min(100, base + chainBonus),
  };
}
