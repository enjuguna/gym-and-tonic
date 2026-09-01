import { useMemo, useState } from "react";
import { planToICS } from "../../lib/calendar";
import { deleteTemplate, loadTemplates, saveTemplate } from "../../lib/templates";
import { usePlan } from "../../lib/store";
import type { DayIndex } from "../../lib/types";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function PlanningTools() {
  const plan = usePlan((state) => state.plan);
  const preferences = usePlan((state) => state.preferences);
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState(loadTemplates);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const sessions = useMemo(() => Object.keys(plan).length, [plan]);

  const downloadCalendar = () => {
    if (!sessions) { setMessage("Add a session before exporting your calendar."); return; }
    const blob = new Blob([planToICS(plan)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "gym-tonic-week.ics"; link.click(); URL.revokeObjectURL(url);
    setMessage("Calendar file downloaded.");
  };

  const createTemplate = () => {
    const template = saveTemplate(name, plan, preferences);
    if (!template) { setMessage("Add at least one session before saving a template."); return; }
    setTemplates(loadTemplates()); setName(""); setMessage(`Saved “${template.name}”.`);
  };

  const applyTemplate = (template: ReturnType<typeof loadTemplates>[number]) => {
    let added = 0;
    for (const [slot, session] of Object.entries(template.plan)) if (!plan[slot] && session) { usePlan.getState().placeSession(slot as `${DayIndex}-${"am" | "pm"}`, session); added++; }
    for (const [key, value] of Object.entries(template.preferences)) usePlan.getState().setPreference(key as keyof typeof preferences, value as never);
    setMessage(added ? `Added ${added} session${added === 1 ? "" : "s"}; occupied slots stayed untouched.` : "Your current board already has those slots filled.");
  };

  return <section className="mt-8 border-y border-[var(--line)] py-5" aria-labelledby="planning-tools-heading">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow text-[var(--sage)]">Make it repeatable</p><h2 id="planning-tools-heading" className="mt-1 font-display text-2xl font-semibold">Planning tools</h2></div><div className="flex flex-wrap gap-2"><button className="button-secondary" onClick={downloadCalendar}>Export calendar</button><button className="button-secondary" aria-expanded={open} aria-controls="template-panel" onClick={() => setOpen(!open)}>My templates</button></div></div>
    {open && <div id="template-panel" className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
      <div className="surface-card bg-[var(--surface-subtle)] p-4"><p className="text-sm font-semibold">Save this rhythm</p><p className="mt-1 text-xs leading-5 text-[var(--muted)]">Keep a useful week ready for later. Applying it never overwrites an occupied slot.</p><div className="mt-3 flex gap-2"><label className="sr-only" htmlFor="template-name">Template name</label><input id="template-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="My usual week" className="min-w-0 flex-1 rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--focus-ring)]" /><button className="button-primary" onClick={createTemplate}>Save</button></div></div>
      <div className="space-y-2">{templates.length ? templates.map((template) => <div key={template.id} className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-white px-4 py-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{template.name}</p><p className="text-xs text-[var(--muted)]">{Object.keys(template.plan).length} sessions · {DAYS[new Date(template.createdAt).getDay() === 0 ? 6 : new Date(template.createdAt).getDay() - 1]} saved</p></div><button className="text-xs font-semibold text-[var(--sage-deep)] underline underline-offset-4" onClick={() => applyTemplate(template)}>Apply</button><button className="text-xs text-[var(--muted)] hover:text-[var(--danger)]" aria-label={`Delete ${template.name}`} onClick={() => { deleteTemplate(template.id); setTemplates(loadTemplates()); setMessage("Template deleted."); }}>Delete</button></div>) : <p className="rounded-xl border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">No saved rhythms yet. Save this board once it feels like you.</p>}</div>
    </div>}
    {message && <p className="mt-3 text-xs text-[var(--sage-deep)]" role="status">{message}</p>}
  </section>;
}
