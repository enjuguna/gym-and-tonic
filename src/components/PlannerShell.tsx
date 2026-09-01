import { useEffect } from "react";
import Corkboard from "./Corkboard";
import { AppRecovery } from "./ui/AppRecovery";
import { track } from "../lib/analytics";

export default function PlannerShell() {
  useEffect(() => {
    track("planner_opened");
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  return <AppRecovery><Corkboard /></AppRecovery>;
}
