import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useLeaveGuard } from "@/lib/session/use-leave-guard";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function dispatchBeforeUnload() {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event;
}

describe("useLeaveGuard", () => {
  it("prevents leaving while active", () => {
    renderHook(({ a }) => useLeaveGuard(a), { initialProps: { a: true } });
    expect(dispatchBeforeUnload().defaultPrevented).toBe(true);
  });

  it("stops preventing when deactivated", () => {
    const { rerender } = renderHook(({ a }) => useLeaveGuard(a), {
      initialProps: { a: true },
    });
    rerender({ a: false });
    expect(dispatchBeforeUnload().defaultPrevented).toBe(false);
  });

  it("removes the listener on unmount", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useLeaveGuard(true));
    const handler = addSpy.mock.calls.find(
      ([type]) => type === "beforeunload"
    )?.[1];
    expect(handler).toBeDefined();
    unmount();
    expect(removeSpy).toHaveBeenCalledWith("beforeunload", handler);
  });
});
