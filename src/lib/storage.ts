export type StorageState = "available" | "unavailable";

export function getStorageState(): StorageState {
  if (typeof window === "undefined") return "available";
  try {
    const key = "gt_storage_probe";
    window.localStorage.setItem(key, "1");
    window.localStorage.removeItem(key);
    return "available";
  } catch {
    return "unavailable";
  }
}
