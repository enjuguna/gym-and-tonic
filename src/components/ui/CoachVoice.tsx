import { useEffect, useRef, useState } from "react";
import { usePlan } from "../../lib/store";
import { coachLine } from "../../lib/coachVoice";
import { sound } from "../../lib/sound";

/** Floating typewriter card: the coach reacts to everything you do. */
export function CoachVoice({ mcpConnected }: { mcpConnected: boolean }) {
  const activityLog = usePlan((s) => s.activityLog);
  const [line, setLine] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [fading, setFading] = useState(false);
  const queue = useRef<string[]>([]);
  const typing = useRef(false);
  const announcedConnection = useRef(false);

  // announce connection once
  useEffect(() => {
    if (mcpConnected && !announcedConnection.current) {
      announcedConnection.current = true;
      enqueue(coachLine({ kind: "connect", by: "system" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mcpConnected]);

  // react to new activity
  useEffect(() => {
    const last = activityLog[activityLog.length - 1];
    if (!last) return;
    if (last.id === (enqueue as any).lastId) return;
    (enqueue as any).lastId = last.id;
    enqueue(coachLine(last));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityLog]);

  function enqueue(text: string) {
    queue.current.push(text);
    pump();
  }

  function pump() {
    if (typing.current || !queue.current.length) return;
    const text = queue.current.shift()!;
    typing.current = true;
    setFading(false);
    setLine(text);
    setTyped("");
    let i = 0;
    sound.tick(340);
    const iv = setInterval(() => {
      i++;
      setTyped(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(iv);
        typing.current = false;
        setTimeout(() => {
          setFading(true);
          setTimeout(() => {
            setLine(null);
            pump();
          }, 900);
        }, 4200);
      }
    }, 24);
  }

  if (!line) return null;

  return (
    <div
      className={`fixed bottom-5 left-5 z-40 max-w-xs rounded-2xl border border-[#e6e1d4] bg-white/95 p-4 shadow-xl backdrop-blur transition-opacity duration-700 ${fading ? "opacity-0" : "opacity-100"}`}
      role="status"
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-700 text-xs font-bold text-white">
          C
        </span>
        <p className="font-serif text-[13px] italic leading-snug text-stone-600">
          {typed}
          <span className="ml-0.5 inline-block h-3.5 w-1 animate-pulse bg-emerald-700/60 align-middle" />
        </p>
      </div>
    </div>
  );
}
