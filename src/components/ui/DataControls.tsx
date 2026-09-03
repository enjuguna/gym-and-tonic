import { useRef, useState } from "react";
import { exportPlannerBackup, importPlannerBackup, resetPlannerData } from "../../lib/store";
import { analyticsDisabled, setAnalyticsDisabled, track } from "../../lib/analytics";
import { applyContentRefresh, previewContentRefresh } from "../../lib/contentRefresh";
import { usePlan } from "../../lib/store";

export function DataControls() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [analyticsOff, setAnalyticsOff] = useState(analyticsDisabled);
  const plan = usePlan((state) => state.plan);
  const replacePlanContent = usePlan((state) => state.replacePlanContent);
  const fileRef = useRef<HTMLInputElement>(null);

  const download = () => {
    const blob = new Blob([exportPlannerBackup()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `gym-tonic-plan-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    track("plan_exported");
    setMessage("Plan exported. Keep the file somewhere safe.");
  };

  const importFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setMessage(importPlannerBackup(String(reader.result ?? "")) ? "Plan restored on this device." : "That file is not a valid Gym & Tonic backup.");
    reader.onerror = () => setMessage("The backup could not be read.");
    reader.readAsText(file);
  };
  const refreshChanges = previewContentRefresh(plan);
  const refreshContent = () => {
    if (!refreshChanges.length || !window.confirm(`Refresh ${refreshChanges.length} legacy session${refreshChanges.length === 1 ? "" : "s"} with global wording? Your notes and progress stay unchanged.`)) return;
    replacePlanContent(applyContentRefresh(plan));
    setMessage("Content refreshed. Your personal progress was kept.");
  };

  return <div className="relative">
    <button className="button-secondary px-3 py-1.5 text-[11px]" aria-expanded={open} aria-controls="data-controls" onClick={() => setOpen(!open)}>Data controls</button>
    {open && <div id="data-controls" className="absolute right-0 top-10 z-40 w-80 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-strong)]" role="dialog" aria-label="Data controls">
      <p className="eyebrow text-[var(--sage)]">Your browser, your plan</p>
      <p className="mt-2 text-xs leading-5 text-[var(--muted)]">Download a copy before changing browsers or clearing site data.</p>
      <div className="mt-4 grid gap-2"><button className="button-secondary w-full text-left" onClick={download}>Download my plan</button><button className="button-secondary w-full text-left" onClick={() => fileRef.current?.click()}>Restore from backup</button><input ref={fileRef} className="sr-only" type="file" accept="application/json" onChange={(event) => importFile(event.target.files?.[0])} /></div>
      <label className="mt-4 flex cursor-pointer items-start gap-2 border-t border-[var(--line)] pt-4 text-xs leading-5 text-[var(--muted)]"><input type="checkbox" checked={analyticsOff} onChange={(event) => { const disabled = event.target.checked; setAnalyticsDisabled(disabled); setAnalyticsOff(disabled); }} /><span>Turn off anonymous product analytics. We never send your training data.</span></label>
      <button className="mt-4 text-xs font-semibold text-red-700 underline underline-offset-4" onClick={() => { if (window.confirm("Delete this browser's Gym & Tonic plan, history, reflections, and workout progress? Export first if you might need it.")) { resetPlannerData(); window.location.reload(); } }}>Delete local data</button>
      {refreshChanges.length > 0 && <div className="mt-4 border-t border-[var(--line)] pt-4"><p className="text-xs font-semibold text-[var(--ink)]">A wording refresh is available</p><p className="mt-1 text-xs leading-5 text-[var(--muted)]">Preview {refreshChanges.length} older place-specific session or meal label before applying global wording.</p><button className="button-secondary mt-2 w-full text-left" onClick={refreshContent}>Preview and refresh wording</button></div>}
      {message && <p className="mt-3 rounded-lg bg-[var(--paper)] px-3 py-2 text-xs text-[var(--ink)]" role="status">{message}</p>}
      <a href="/data" className="mt-3 block text-xs text-[var(--sage-deep)] underline underline-offset-4">Learn about your data</a>
    </div>}
  </div>;
}
