import { act, cleanup, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { CaseSessionProvider, useCaseSession } from "@/lib/session/context";
import type { PhotoRef, ReducedPhotoRef } from "@/lib/session/state";

afterEach(cleanup);

beforeAll(() => {
  if (typeof URL.revokeObjectURL !== "function") {
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: () => undefined,
      writable: true,
    });
  }
});

function makePhoto(name: string, url: string): PhotoRef {
  return { file: new File(["x"], name, { type: "image/jpeg" }), url };
}

function makeReduced(url: string): ReducedPhotoRef {
  return { blob: new Blob(["y"], { type: "image/jpeg" }), url };
}

function renderSession(createChatId: () => string = () => "id-1") {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <CaseSessionProvider createChatId={createChatId}>
      {children}
    </CaseSessionProvider>
  );
  return renderHook(() => useCaseSession(), { wrapper });
}

describe("CaseSessionProvider", () => {
  it("initializes the chatId from createChatId", () => {
    const { result } = renderSession(() => "id-1");
    expect(result.current.state.chatId).toBe("id-1");
    expect(result.current.state.screen).toBe("form");
  });

  it("reset() starts a fresh session with a new chatId and empty form", () => {
    const factory = vi
      .fn<() => string>()
      .mockReturnValueOnce("id-1")
      .mockReturnValueOnce("id-2");
    const { result } = renderSession(factory);

    act(() => {
      result.current.dispatch({
        field: "modelName",
        type: "FORM_CHANGED",
        value: "Phone",
      });
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.state.chatId).toBe("id-2");
    expect(result.current.state.formValues.modelName).toBe("");
    expect(result.current.state.screen).toBe("form");
  });

  it("revokes the previous photo URL exactly once when a photo is replaced", () => {
    const revoke = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => undefined);
    const { result } = renderSession();

    act(() => {
      result.current.dispatch({
        photo: makePhoto("a.jpg", "blob:a"),
        type: "PHOTO_SELECTED",
      });
    });
    act(() => {
      result.current.dispatch({
        photo: makePhoto("b.jpg", "blob:b"),
        type: "PHOTO_SELECTED",
      });
    });

    expect(revoke.mock.calls.filter(([url]) => url === "blob:a")).toHaveLength(
      1
    );
    expect(revoke).not.toHaveBeenCalledWith("blob:b");
    revoke.mockRestore();
  });

  it("revokes the current photo URL when the photo is removed", () => {
    const revoke = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => undefined);
    const { result } = renderSession();

    act(() => {
      result.current.dispatch({
        photo: makePhoto("b.jpg", "blob:b"),
        type: "PHOTO_SELECTED",
      });
    });
    act(() => {
      result.current.dispatch({ type: "PHOTO_REMOVED" });
    });

    expect(revoke).toHaveBeenCalledWith("blob:b");
    expect(revoke.mock.calls.filter(([url]) => url === "blob:b")).toHaveLength(
      1
    );
    revoke.mockRestore();
  });

  it("revokes the reduced photo URL when it is replaced by a reset", () => {
    const revoke = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => undefined);
    const { result } = renderSession();

    act(() => {
      result.current.dispatch({
        caseContext: null as never,
        imageAnalysis: null as never,
        reducedPhoto: makeReduced("blob:r"),
        type: "ANALYSIS_SUCCEEDED",
      });
    });
    act(() => {
      result.current.reset();
    });

    expect(revoke).toHaveBeenCalledWith("blob:r");
    revoke.mockRestore();
  });

  it("revokes current photo and reduced URLs on unmount", () => {
    const revoke = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => undefined);
    const { result, unmount } = renderSession();

    act(() => {
      result.current.dispatch({
        photo: makePhoto("c.jpg", "blob:c"),
        type: "PHOTO_SELECTED",
      });
    });
    act(() => {
      result.current.dispatch({
        caseContext: null as never,
        imageAnalysis: null as never,
        reducedPhoto: makeReduced("blob:rc"),
        type: "ANALYSIS_SUCCEEDED",
      });
    });
    revoke.mockClear();

    unmount();

    expect(revoke).toHaveBeenCalledWith("blob:c");
    expect(revoke).toHaveBeenCalledWith("blob:rc");
    revoke.mockRestore();
  });

  it("never reads or writes browser storage", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const getItem = vi.spyOn(Storage.prototype, "getItem");
    const { result, unmount } = renderSession();

    act(() => {
      result.current.dispatch({
        photo: makePhoto("d.jpg", "blob:d"),
        type: "PHOTO_SELECTED",
      });
    });
    act(() => {
      result.current.reset();
    });
    unmount();

    expect(setItem).not.toHaveBeenCalled();
    expect(getItem).not.toHaveBeenCalled();
    setItem.mockRestore();
    getItem.mockRestore();
  });
});

describe("useCaseSession", () => {
  it("throws outside CaseSessionProvider", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    expect(() => renderHook(() => useCaseSession())).toThrow(
      "useCaseSession must be used within CaseSessionProvider"
    );
    consoleError.mockRestore();
  });
});
