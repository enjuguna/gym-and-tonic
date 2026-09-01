import { Component, type ErrorInfo, type ReactNode } from "react";

export class AppRecovery extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Gym & Tonic recovery boundary", error, info);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--paper)] p-6 text-[var(--ink)]">
        <section className="surface-card max-w-md p-7">
          <p className="eyebrow text-[var(--terra)]">Your board is safe</p>
          <h1 className="mt-2 font-display text-3xl font-semibold">This view needs a fresh start.</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Your plan stays on this device. Refresh to reopen it; if this keeps happening, export or reset your data from the planner controls.</p>
          <button className="button-primary mt-6" onClick={() => window.location.reload()}>Refresh planner</button>
        </section>
      </main>
    );
  }
}
