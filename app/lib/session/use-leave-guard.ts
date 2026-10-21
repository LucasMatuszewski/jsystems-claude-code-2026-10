"use client";

import { useEffect } from "react";

/**
 * While `active`, asks the browser to confirm before the page is unloaded.
 */
export function useLeaveGuard(active: boolean): void {
  useEffect(() => {
    if (!active) {
      return;
    }
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [active]);
}
