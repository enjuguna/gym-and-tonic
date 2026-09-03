import { useEffect, useState } from "react";
import { getStorageState, type StorageState } from "../../lib/storage";

export function ConnectionStatus() {
  const [online, setOnline] = useState(true);
  const [storage, setStorage] = useState<StorageState>("available");
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    setStorage(getStorageState());
    window.addEventListener("online", update); window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  if (online && storage === "available") return null;
  return <p className="bg-amber-100 px-3 py-1 text-center text-[11px] font-medium text-amber-900" role="status">{storage === "unavailable" ? "Browser storage is unavailable. Changes may not survive a reload." : "You’re offline. Your saved week is still available on this device."}</p>;
}
