import { useEffect, useState } from "react";

export function ConnectionStatus() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update); window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  if (online) return null;
  return <p className="bg-amber-100 px-3 py-1 text-center text-[11px] font-medium text-amber-900" role="status">You’re offline. Your saved week is still available on this device.</p>;
}
