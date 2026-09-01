import { useState } from "react";
import type { CompletionEntry } from "../../lib/types";

interface Props { entry: CompletionEntry; onSave: (input: Omit<CompletionEntry, "completedAt">) => void; onClose: () => void; }

export function ReflectionPanel({ entry, onSave, onClose }: Props) {
  const [note, setNote] = useState(entry.note ?? "");
  const [effort, setEffort] = useState<CompletionEntry["effort"]>(entry.effort);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="reflection-heading" onClick={(event) => event.stopPropagation()}>
        <p className="eyebrow text-emerald-700">Nice work</p><h2 id="reflection-heading" className="mt-1 font-serif text-2xl font-semibold">How did it feel?</h2><p className="mt-1 text-sm text-stone-500">Optional — a tiny note helps your next week get smarter.</p>
        <div className="mt-5"><label htmlFor="reflection-note" className="eyebrow text-stone-400">A quick note</label><textarea id="reflection-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={180} rows={3} placeholder="Felt strong, good energy…" className="mt-2 w-full resize-none rounded-xl border border-stone-200 p-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20" /></div>
        <fieldset className="mt-4"><legend className="eyebrow text-stone-400">Effort</legend><div className="mt-2 flex gap-2">{([1,2,3,4,5] as const).map((value) => <button key={value} onClick={() => setEffort(value)} aria-pressed={effort === value} className={`grid h-9 w-9 place-items-center rounded-full border text-sm ${effort === value ? "border-emerald-700 bg-emerald-700 text-white" : "border-stone-200 text-stone-500 hover:border-emerald-600"}`}>{value}</button>)}</div></fieldset>
        <div className="mt-5 flex justify-end gap-2"><button onClick={onClose} className="button-quiet">Not now</button><button onClick={() => { onSave({ note: note.trim() || undefined, effort }); onClose(); }} className="button-primary">Save reflection</button></div>
      </div>
    </div>
  );
}
