import { useEffect, useMemo, useRef, useState } from "react";
import { useBoard, LAUNCH_CASE } from "../lib/store";
import { registerAllTools } from "../lib/webmcp";
import { scoreAccusation } from "../lib/caseEngine";
import { buildTimeline } from "../lib/timeline";
import { sound } from "../lib/sound";

type Tab = "board" | "dossiers" | "timeline";

const KIND_META: Record<string, { icon: string; tint: string; label: string }> = {
  statement: { icon: "🗣️", tint: "text-sky-300 bg-sky-400/10 ring-sky-400/20", label: "statement" },
  document: { icon: "📄", tint: "text-amber-300 bg-amber-400/10 ring-amber-400/20", label: "document" },
  log: { icon: "📋", tint: "text-emerald-300 bg-emerald-400/10 ring-emerald-400/20", label: "log" },
  physical: { icon: "🔬", tint: "text-rose-300 bg-rose-400/10 ring-rose-400/20", label: "physical" },
  observation: { icon: "👁️", tint: "text-violet-300 bg-violet-400/10 ring-violet-400/20", label: "observation" },
  suspect: { icon: "👤", tint: "text-orange-300 bg-orange-400/10 ring-orange-400/20", label: "suspect" },
};

const evById = new Map(LAUNCH_CASE.evidence.map((e) => [e.id, e]));
const susById = new Map(LAUNCH_CASE.suspects.map((s) => [s.id, s]));

export default function Corkboard() {
  const pins = useBoard((s) => s.pins);
  const notes = useBoard((s) => s.notes);
  const theories = useBoard((s) => s.theories);
  const proposals = useBoard((s) => s.proposals);
  const pinItem = useBoard((s) => s.pinItem);
  const [tab, setTab] = useState<Tab>("board");
  const [mcpStatus, setMcpStatus] = useState<{ supported: boolean; registered: number } | null>(null);
  const [accusing, setAccusing] = useState(false);
  const [epilogue, setEpilogue] = useState<ReturnType<typeof scoreAccusation> | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const pendingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerAllTools().then(setMcpStatus).catch(console.error);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "1") setTab("board");
      else if (e.key === "2") setTab("dossiers");
      else if (e.key === "3") setTab("timeline");
      else if (e.key === "s") setSoundOn((v) => !v);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    sound.toggle(soundOn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundOn]);

  const pending = proposals.filter((p) => p.state === "pending");
  const timeline = useMemo(() => buildTimeline(LAUNCH_CASE), []);
  void pendingRef;

  if (epilogue)
    return <Epilogue result={epilogue} citedCount={pins.length} onReplay={() => location.reload()} />;

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100">
      {/* ambient glow */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-amber-500/[0.04] blur-[120px]" />
        <div className="absolute bottom-0 right-1/5 h-80 w-80 rounded-full bg-red-500/[0.03] blur-[110px]" />
      </div>

      {/* header */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3.5">
          <h1 className="flex items-baseline gap-2 text-[15px] font-semibold tracking-tight">
            <span className="text-amber-400">◉</span>
            Cold Case
            <span className="hidden text-sm font-normal text-zinc-500 sm:inline">— The Vigil at Karura House</span>
          </h1>
          <nav className="order-3 flex w-full gap-1 sm:order-2 sm:w-auto" role="tablist">
            {(
              [
                ["board", `Board`, pins.length],
                ["dossiers", "Suspects", LAUNCH_CASE.suspects.length],
                ["timeline", "Timeline", null],
              ] as Array<[Tab, string, number | null]>
            ).map(([t, label, count], i) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => { setTab(t); sound.tick(520 + i * 60); }}
                className={`rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                  tab === t ? "bg-white/[0.07] text-amber-200" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {label}
                {count != null && <span className="ml-1.5 text-xs text-zinc-600">{count}</span>}
              </button>
            ))}
          </nav>
          <div className="order-2 ml-auto flex items-center gap-2.5 sm:order-3">
            <button
              onClick={() => setSoundOn((v) => !v)}
              title={soundOn ? "Ambience on (S)" : "Ambience off (S)"}
              aria-label="Toggle ambience"
              className={`grid h-8 w-8 place-items-center rounded-lg text-sm transition-colors ${
                soundOn ? "bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/30" : "bg-white/[0.05] text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {soundOn ? "🔊" : "🔇"}
            </button>
            {mcpStatus && (
              <span
                className={`hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium md:inline-flex ${
                  mcpStatus.supported
                    ? "bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/25"
                    : "bg-white/[0.05] text-zinc-500 ring-1 ring-white/10"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${mcpStatus.supported ? "animate-pulse bg-emerald-400" : "bg-zinc-600"}`} />
                {mcpStatus.supported ? `${mcpStatus.registered} site tools` : "solo mode"}
              </span>
            )}
            <button
              onClick={() => setAccusing(true)}
              className="rounded-lg bg-gradient-to-b from-red-500 to-red-600 px-4 py-1.5 text-[13px] font-semibold text-white shadow-lg shadow-red-950/40 transition-all hover:brightness-110 active:scale-[0.98]"
            >
              Accuse
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-6 pb-24 pt-6">
        {/* case card */}
        <section className="mb-8 overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.045] to-transparent p-6 backdrop-blur-sm sm:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-400/90">Case Nº 1998-0711 · Nairobi</p>
          <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-zinc-50">The Vigil at Karura House</h2>
          <p className="mt-3 max-w-3xl text-[13.5px] leading-relaxed text-zinc-400">{LAUNCH_CASE.briefing}</p>
        </section>

        {/* agent proposals */}
        {pending.length > 0 && tab === "board" && (
          <section ref={pendingRef} className="mb-8 animate-[fadeIn_0.3s_ease]">
            <h3 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-400/90">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Your partner proposes — review before it hits the board
            </h3>
            <div className="space-y-2">
              {pending.map((p) => (
                <ProposalRow key={p.id} proposal={p} />
              ))}
            </div>
          </section>
        )}

        {tab === "board" && (
          <>
            {theories.length > 0 && (
              <section className="mb-8 grid gap-3 lg:grid-cols-2">
                {theories.map((t) => (
                  <article
                    key={t.id}
                    className={`group relative overflow-hidden rounded-xl border p-4 transition-colors ${
                      t.status === "accepted"
                        ? "border-emerald-400/30 bg-emerald-400/[0.05]"
                        : t.status === "proposed"
                          ? "border-amber-400/30 bg-amber-400/[0.04]"
                          : "border-white/[0.06] bg-white/[0.02] opacity-55"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium leading-snug text-zinc-100">{t.claim}</p>
                      <span
                        className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          t.status === "accepted"
                            ? "bg-emerald-400/15 text-emerald-300"
                            : t.status === "proposed"
                              ? "bg-amber-400/15 text-amber-300"
                              : "bg-white/5 text-zinc-500"
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-zinc-500">
                      {t.by === "agent" ? "🤝 partner" : "you"} · cites {t.evidenceIds.length} items
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {t.evidenceIds.map((eid) => (
                        <button
                          key={eid}
                          onClick={() => setExpanded(expanded === eid ? null : eid)}
                          className="rounded-md bg-white/[0.05] px-2 py-0.5 font-mono text-[10.5px] text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-200"
                        >
                          {KIND_META[evById.get(eid)?.kind ?? "suspect"]?.icon} {eid}
                        </button>
                      ))}
                    </div>
                    {t.by === "agent" && t.status === "proposed" && (
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => useBoard.getState().setTheoryStatus(t.id, "accepted")} className="rounded-lg bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-400/25 hover:bg-emerald-500/25">Accept</button>
                        <button onClick={() => useBoard.getState().setTheoryStatus(t.id, "challenged")} className="rounded-lg bg-red-500/10 px-3 py-1 text-xs font-medium text-red-300 ring-1 ring-red-400/20 hover:bg-red-500/20">Challenge</button>
                      </div>
                    )}
                  </article>
                ))}
              </section>
            )}

            {pins.length === 0 ? (
              <EmptyBoard />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {pins.map((pin) => {
                  const meta = KIND_META[evById.get(pin.itemId)?.kind ?? "suspect"];
                  const item = evById.get(pin.itemId) ?? susById.get(pin.itemId);
                  const isOpen = expanded === pin.itemId;
                  return (
                    <article
                      key={pin.id}
                      onClick={() => setExpanded(isOpen ? null : pin.itemId)}
                      className={`cursor-pointer rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 transition-all hover:border-white/[0.14] hover:bg-white/[0.05] ${isOpen ? "sm:col-span-2 xl:col-span-3" : ""}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${meta.tint}`}>
                          {meta.icon} {meta.label}
                        </span>
                        {pin.by === "agent" && <span className="text-[11px] text-emerald-400/70">🤝 partner</span>}
                        <span className="ml-auto font-mono text-[10px] text-zinc-600">{pin.itemId}</span>
                      </div>
                      <h4 className="mt-2.5 text-sm font-semibold leading-snug text-zinc-100">
                        {"title" in (item ?? {}) ? (item as { title?: string; name?: string }).title ?? (item as { name?: string }).name : ""}
                      </h4>
                      {"content" in (item ?? {}) && (
                        <p className={`mt-1.5 text-[13px] leading-relaxed text-zinc-400 ${isOpen ? "" : "line-clamp-3"}`}>
                          {(item as { content: string }).content}
                        </p>
                      )}
                      {pin.note && <p className="mt-2 border-l-2 border-amber-400/40 pl-2.5 text-xs italic text-amber-200/70">{pin.note}</p>}
                      {notes.filter((n) => n.pinId === pin.id).map((n) => (
                        <p key={n.id} className="mt-2 rounded-lg bg-yellow-400/10 px-3 py-1.5 text-xs text-yellow-200/90">{n.text}</p>
                      ))}
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === "dossiers" && (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {LAUNCH_CASE.suspects.map((s) => {
              const pinned = pins.some((p) => p.itemId === s.id);
              return (
                <article
                  key={s.id}
                  className="group rounded-xl border border-white/[0.07] bg-white/[0.03] p-5 transition-all hover:border-white/[0.14]"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-zinc-50">{s.name}</h3>
                      <p className="text-xs uppercase tracking-wide text-amber-400/70">{s.role}</p>
                    </div>
                    <span className="text-2xl opacity-40 transition-opacity group-hover:opacity-70">👤</span>
                  </div>
                  <dl className="mt-4 space-y-2.5 text-[13px] leading-relaxed">
                    <Field k="Alibi" v={s.alibi} />
                    <Field k="Motive" v={s.motive} />
                    <Field k="Ties" v={s.relationship} />
                  </dl>
                  {!pinned ? (
                    <button
                      onClick={() => { pinItem(s.id); sound.tick(); }}
                      className="mt-4 w-full rounded-lg bg-white/[0.06] py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-amber-400/15 hover:text-amber-200"
                    >
                      📌 Pin to board
                    </button>
                  ) : (
                    <p className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-400/10 py-2 text-xs font-medium text-emerald-300 ring-1 ring-emerald-400/20">📌 On the board</p>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {tab === "timeline" && (
          <div className="mx-auto max-w-3xl">
            <ol className="relative ml-3 border-l border-white/10">
              {timeline.map((ev, i) => (
                <li key={`${ev.time}-${i}`} className="ml-6 pb-6">
                  <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-zinc-950 bg-amber-400" />
                  <p className="font-mono text-xs font-semibold text-amber-300">{ev.time}</p>
                  <p className="mt-0.5 text-sm capitalize text-zinc-300">{ev.label}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {ev.itemIds.map((id) => (
                      <button
                        key={id}
                        onClick={() => setExpanded(expanded === id ? null : id)}
                        className="rounded-md bg-white/[0.05] px-2 py-0.5 font-mono text-[10px] text-zinc-500 hover:text-zinc-300"
                      >
                        {id}
                      </button>
                    ))}
                  </div>
                  {expanded && ev.itemIds.includes(expanded) && (
                    <p className="mt-2 rounded-lg border border-white/[0.07] bg-white/[0.03] p-3 text-[13px] leading-relaxed text-zinc-400">
                      {evById.get(expanded)?.content}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}

        <footer className="mt-16 border-t border-white/[0.06] pt-5 text-center text-xs text-zinc-600">
          Keys: <kbd className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px]">1</kbd>{" "}
          <kbd className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px]">2</kbd>{" "}
          <kbd className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px]">3</kbd> switch tabs ·{" "}
          <kbd className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px]">S</kbd> ambience
        </footer>
      </main>

      {accusing && (
        <AccuseDialog
          onPick={(id) => {
            setEpilogue(scoreAccusation(LAUNCH_CASE, id, pins.map((p) => p.itemId)));
            sound.sting(id === LAUNCH_CASE.solution.culpritId);
          }}
          onClose={() => setAccusing(false)}
        />
      )}
    </div>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[10.5px] font-semibold uppercase tracking-wide text-zinc-500">{k}</dt>
      <dd className="mt-0.5 text-zinc-300">{v}</dd>
    </div>
  );
}

function ProposalRow({ proposal }: { proposal: ReturnType<typeof useBoard.getState>["proposals"][number] }) {
  const approve = useBoard((s) => s.approveProposal);
  const undo = useBoard((s) => s.undoProposal);
  const itemId = (proposal.payload as { itemId?: string }).itemId;
  const item = itemId ? (evById.get(itemId) ?? susById.get(itemId)) : null;
  const title =
    item && "title" in item ? item.title : item && "name" in item ? item.name : "";
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.04] px-4 py-3">
      <span className="rounded-md bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
        {proposal.kind.replace("-", " ")}
      </span>
      <span className="min-w-0 flex-1 text-[13px] text-zinc-300">
        {title && <strong className="mr-1.5 text-zinc-100">{title}</strong>}
        {proposal.summary}
        <span className="ml-2 hidden font-mono text-[10px] text-zinc-600 sm:inline">{proposal.toolSource}</span>
      </span>
      <span className="flex shrink-0 gap-2">
        <button onClick={() => { approve(proposal.id); sound.tick(720); }} className="rounded-lg bg-emerald-500/20 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/30 transition-colors hover:bg-emerald-500/30">Approve</button>
        <button onClick={() => undo(proposal.id)} className="rounded-lg bg-white/[0.05] px-3.5 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-200">Reject</button>
      </span>
    </div>
  );
}

function EmptyBoard() {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 p-14 text-center">
      <p className="text-3xl opacity-30">📌</p>
      <p className="mt-3 text-sm font-medium text-zinc-400">The board is empty.</p>
      <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-relaxed text-zinc-500">
        Open ChatGPT beside this page and try{" "}
        <em className="text-zinc-400 not-italic">“search for anything about the chai”</em> or{" "}
        <em className="text-zinc-400 not-italic">“cross-reference Grace's statement with the taxi receipt.”</em>{" "}
        Approve what convinces you — every pin lands here.
      </p>
    </div>
  );
}

function AccuseDialog({ onPick, onClose }: { onPick: (id: string) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div
        className="w-full max-w-md overflow-hidden rounded-t-2xl border border-white/10 bg-zinc-900 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="border-b border-white/[0.07] bg-gradient-to-b from-red-500/10 to-transparent px-6 py-5">
          <h2 className="text-lg font-semibold text-zinc-50">Make your accusation</h2>
          <p className="mt-1 text-[13px] text-zinc-500">This ends the case. Choose who poisoned Charles Karura.</p>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-3">
          {LAUNCH_CASE.suspects.map((s) => (
            <button
              key={s.id}
              onClick={() => onPick(s.id)}
              className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-colors hover:bg-red-500/10"
            >
              <span>
                <span className="block text-sm font-medium text-zinc-100">{s.name}</span>
                <span className="block text-xs text-zinc-500">{s.role}</span>
              </span>
              <span className="text-red-400 opacity-0 transition-opacity hover:opacity-100">→</span>
            </button>
          ))}
        </div>
        <button onClick={onClose} className="w-full border-t border-white/[0.07] py-3.5 text-sm text-zinc-500 transition-colors hover:text-zinc-300">
          Not yet — back to the board
        </button>
      </div>
    </div>
  );
}

function Epilogue({
  result,
  citedCount,
  onReplay,
}: {
  result: ReturnType<typeof scoreAccusation>;
  citedCount: number;
  onReplay: () => void;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-zinc-100">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-amber-500/[0.05] blur-[130px]" />
      </div>
      <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.08] bg-zinc-900/80 p-8 shadow-2xl backdrop-blur-xl">
        <p className="text-4xl">{result.correct ? "🎯" : "🌫️"}</p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          {result.correct ? "Case closed." : "The trail went cold."}
        </h1>
        <p className="mt-3 text-[13.5px] leading-relaxed text-zinc-400">
          {result.correct ? `You accused ${result.culpritName} — and it was ${result.culpritName}. ` : `You accused the wrong person. It was ${result.culpritName}. `}
          {result.explanation}
        </p>
        <div className="mt-6 grid grid-cols-3 gap-3">
          <Stat label="Deduction" value={`${result.deductionScore}`} suffix="/100" />
          <Stat label="Key evidence" value={`${result.keyEvidenceFound.length}/${result.keyEvidenceFound.length + Math.max(0, 5 - result.keyEvidenceFound.length)}`} />
          <Stat label="Cards pinned" value={`${citedCount}`} />
        </div>
        <button
          onClick={onReplay}
          className="mt-7 w-full rounded-xl bg-amber-500 py-3 text-sm font-semibold text-zinc-950 transition-all hover:bg-amber-400 active:scale-[0.99]"
        >
          Play again
        </button>
        <p className="mt-4 text-center text-xs text-zinc-600">
          The partner read everything. You decided everything. That's WebMCP.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3.5 text-center">
      <div className="text-xl font-bold text-amber-300">
        {value}
        {suffix && <span className="text-xs font-normal text-zinc-500">{suffix}</span>}
      </div>
      <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">{label}</div>
    </div>
  );
}
