import { useEffect, useRef } from "react";

const FOCUSABLE = "a[href], button:not([disabled]), textarea, input:not([disabled]), select, summary, [tabindex]:not([tabindex='-1'])";

/** Keep keyboard focus inside a modal and return it to the launching control. */
export function useDialogFocus<T extends HTMLElement>() {
  const dialogRef = useRef<T>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!dialog) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const focusable = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((item) => item.offsetParent !== null);
      if (!focusable.length) { event.preventDefault(); return; }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    dialog.addEventListener("keydown", onKeyDown);
    return () => { dialog.removeEventListener("keydown", onKeyDown); previous?.focus(); };
  }, []);
  return dialogRef;
}
