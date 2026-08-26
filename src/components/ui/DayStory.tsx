import { useEffect } from "react";
import { SceneImage } from "./SceneImage";
import { sceneFor } from "../../lib/scenes";
import { exerciseById } from "../../lib/coach";
import type { Session } from "../../lib/types";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** Full-width editorial spread for one session. */
export function DayStory({
  slot,
  session,
  onClose,
}: {
  slot: string;
  session: Session;
  onClose: () => void;
}) {
  const [d, when] = slot.split("-");
  const scene = sceneFor(session.focus, when);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <section className="animate-rise mb-8 overflow-hidden rounded-3xl border border-[#e6e1d4] bg-white shadow-xl ring-4 ring-[#31572c]/[0.06]">
      {/* spread label — clarifies this is a story panel, not a modal */}
      <div className="flex items-center justify-between border-b border-[#e6e1d4] px-6 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
          📖 Session story
        </p>
        <button
          onClick={onClose}
          className="rounded-full px-3 py-1 text-xs font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800"
        >
          Close story ✕
        </button>
      </div>

      <SceneImage scene={scene} kenburns className="h-52 sm:h-64">
        <div className="flex h-full flex-col justify-end bg-gradient-to-t from-black/60 via-black/10 to-black/30 p-6 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] drop-shadow">
            {DAYS[Number(d)]} · {when === "am" ? "Morning" : "Evening"} ·{" "}
            <span className="rounded bg-white/15 px-1.5 py-0.5 backdrop-blur-sm">{session.intensity}</span>
          </p>
          <h2 className="mt-1 font-serif text-3xl font-semibold tracking-tight drop-shadow sm:text-4xl">
            {session.title}
          </h2>
        </div>
      </SceneImage>

      <div className="grid gap-6 p-6 sm:grid-cols-[1fr_220px]">
        {/* the work */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">The work</p>
          <ol className="mt-3 space-y-3">
            {session.exercises.map((eid, i) => {
              const ex = exerciseById(eid);
              if (!ex) return null;
              return (
                <li key={eid} className="flex gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-700/10 font-serif text-sm font-bold text-emerald-800">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium">
                      {ex.name}{" "}
                      <span className="ml-1 rounded bg-stone-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-stone-500">
                        {ex.duration} min
                      </span>
                    </p>
                    <p className="text-xs italic leading-relaxed text-stone-400">{ex.cues}</p>
                  </div>
                </li>
              );
            })}
          </ol>

          {session.note && (
            <div className="mt-5 border-l-2 border-amber-600/50 pl-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Coach's note</p>
              <p className="font-serif text-sm italic text-stone-600">{session.note}</p>
            </div>
          )}
        </div>

        {/* refuel recipe card — solid premium treatment, aligned to grid */}
        {session.refuel && (
          <aside className="self-start overflow-hidden rounded-xl border border-[#e6e1d4] bg-white shadow-sm">
            <div className="bg-[#bc6c25] px-4 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                Post-workout kitchen
              </p>
            </div>
            <div className="p-4">
              <p className="font-serif text-lg font-semibold leading-tight">{session.refuel}</p>
              <p className="mt-2 text-xs italic leading-relaxed text-stone-400">
                Recovery starts in the kitchen. Eat like you mean it.
              </p>
            </div>
          </aside>
        )}
      </div>
    </section>
  );
}
