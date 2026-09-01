import { useState } from "react";
import { track } from "../lib/analytics";
import { SceneImage } from "./ui/SceneImage";

const steps = [
  ["01", "Shape your week", "Place useful sessions across all fourteen slots, at your pace."],
  ["02", "Follow the work", "Open a guided workout, move through exercises, and finish when you are ready."],
  ["03", "Notice the change", "Keep a light reflection and see the consistency you are building."],
];

export default function Showcase() {
  const [menuOpen, setMenuOpen] = useState(false);
  const openPlanner = () => track("showcase_open_planner");
  return (
    <div className="grain min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <a href="/" className="font-display text-xl font-semibold tracking-tight">gym<span className="text-[var(--sage)]">&amp;</span>tonic</a>
        <nav className="hidden items-center gap-6 text-sm text-[var(--muted)] sm:flex" aria-label="Main navigation">
          <a href="#how-it-works" className="hover:text-[var(--ink)]">How it works</a>
          <a href="#local-first" className="hover:text-[var(--ink)]">Your data</a>
          <a href="/tools" className="hover:text-[var(--ink)]">Coach tools</a>
          <a href="/plan" onClick={openPlanner} className="button-primary">Open planner</a>
        </nav>
        <button className="button-secondary sm:hidden" aria-expanded={menuOpen} aria-controls="showcase-menu" onClick={() => setMenuOpen(!menuOpen)}>Menu</button>
      </header>
      {menuOpen && <nav id="showcase-menu" className="mx-5 mb-4 grid gap-3 border-y border-[var(--line)] py-4 text-sm sm:hidden" aria-label="Mobile navigation"><a href="#how-it-works">How it works</a><a href="#local-first">Your data</a><a href="/tools">Coach tools</a><a href="/plan" onClick={openPlanner} className="font-semibold text-[var(--sage-deep)]">Open planner →</a></nav>}

      <main>
        <section className="mx-auto grid max-w-6xl gap-8 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:py-16">
          <div className="max-w-xl">
            <p className="eyebrow text-[var(--terra)]">A training rhythm, made local</p>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-[.96] tracking-tight sm:text-6xl">Your week, well trained.</h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-[var(--muted)]">Gym &amp; Tonic is a calm Kenyan-first space to plan a session, follow it properly, and see the small proof that you are showing up.</p>
            <div className="mt-8 flex flex-wrap gap-3"><a href="/plan" onClick={openPlanner} className="button-primary text-sm">Open your planner <span aria-hidden="true">→</span></a><a href="#how-it-works" className="button-secondary text-sm">See the flow</a></div>
            <p className="mt-5 text-xs text-[var(--muted)]">No account. No pricing screen. Your plan stays on this device.</p>
          </div>
          <SceneImage scene="hero-week" kenburns className="min-h-[360px] rounded-[2rem] shadow-[var(--shadow-strong)] sm:min-h-[440px]">
            <div className="flex h-full items-end p-6"><div className="max-w-xs border border-white/25 bg-black/35 p-4 text-white backdrop-blur-sm"><p className="eyebrow text-white/80">Today’s focus</p><p className="mt-1 font-display text-2xl font-semibold">Make the next session easy to begin.</p></div></div>
          </SceneImage>
        </section>

        <section id="how-it-works" className="border-y border-[var(--line)] bg-[var(--surface)] py-16">
          <div className="mx-auto max-w-6xl px-5 sm:px-8"><p className="eyebrow text-[var(--sage)]">A simple loop</p><h2 className="mt-3 max-w-xl font-display text-4xl font-semibold tracking-tight">Planning is useful only when it reaches real life.</h2><div className="mt-10 grid gap-5 md:grid-cols-3">{steps.map(([number, title, body]) => <article key={number} className="border-t border-[var(--line)] pt-5"><span className="font-display text-2xl text-[var(--terra)]">{number}</span><h3 className="mt-5 font-display text-2xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-[var(--muted)]">{body}</p></article>)}</div></div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-5 py-16 sm:px-8 lg:grid-cols-2">
          <SceneImage scene="refuel" className="min-h-[300px] rounded-[1.75rem]"><div className="flex h-full items-end p-6 text-white"><p className="max-w-xs font-display text-3xl font-semibold">Everyday refuels, named properly.</p></div></SceneImage>
          <div className="flex flex-col justify-center py-3 lg:px-8"><p className="eyebrow text-[var(--terra)]">Kenyan at heart</p><h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">The details should feel familiar.</h2><p className="mt-4 max-w-md leading-7 text-[var(--muted)]">Sessions are paired with specific everyday plates—from rice and ndengu to ugali, tilapia and sukuma—without turning food into a prescription.</p><a href="/plan" onClick={openPlanner} className="button-quiet mt-5 w-fit">Explore the planner →</a></div>
        </section>

        <section id="local-first" className="bg-[var(--ink)] py-16 text-white"><div className="mx-auto grid max-w-6xl gap-8 px-5 sm:px-8 md:grid-cols-[1.1fr_.9fr]"><div><p className="eyebrow text-[#f2b36f]">Local by default</p><h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">Your training week belongs to you.</h2></div><div className="text-sm leading-7 text-white/70"><p>Plans, reflections, and workout progress are stored in your browser. Export a copy whenever you wish, or remove it from the planner’s data controls.</p><p className="mt-4">We use only anonymous, high-level product analytics when enabled—never your workouts, notes, or training history.</p><div className="mt-6 flex gap-4 text-white"><a href="/privacy" className="underline underline-offset-4">Privacy</a><a href="/data" className="underline underline-offset-4">Your data</a><a href="/safety" className="underline underline-offset-4">Safety</a></div></div></div></section>
      </main>
      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-xs text-[var(--muted)] sm:px-8"><span>Gym &amp; Tonic · A considered training week.</span><span>Made for the work between the work.</span></footer>
    </div>
  );
}
