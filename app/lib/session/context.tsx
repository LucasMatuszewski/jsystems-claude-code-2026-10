"use client";

import {
  createContext,
  type Dispatch,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import {
  type CaseSessionAction,
  caseSessionReducer,
} from "@/lib/session/reducer";
import { type CaseSessionState, createInitialState } from "@/lib/session/state";

type CaseSessionContextValue = {
  state: CaseSessionState;
  dispatch: Dispatch<CaseSessionAction>;
  reset: () => void;
};

const CaseSessionContext = createContext<CaseSessionContextValue | null>(null);

type CaseSessionProviderProps = {
  children: ReactNode;
  createChatId?: () => string;
};

const defaultCreateChatId = () => crypto.randomUUID();

export function CaseSessionProvider({
  children,
  createChatId = defaultCreateChatId,
}: CaseSessionProviderProps): React.JSX.Element {
  const [state, dispatch] = useReducer(caseSessionReducer, undefined, () =>
    createInitialState(createChatId())
  );

  const reset = useCallback(() => {
    dispatch({ chatId: createChatId(), type: "RESET" });
  }, [createChatId]);

  const photoUrlRef = useRef<string | null>(null);
  const reducedUrlRef = useRef<string | null>(null);

  // Revoke the previous object URL whenever a photo is replaced, removed or reset.
  useEffect(() => {
    const next = state.originalPhoto?.url ?? null;
    const previous = photoUrlRef.current;
    if (previous !== null && previous !== next) {
      URL.revokeObjectURL(previous);
    }
    photoUrlRef.current = next;
  }, [state.originalPhoto]);

  useEffect(() => {
    const next = state.reducedPhoto?.url ?? null;
    const previous = reducedUrlRef.current;
    if (previous !== null && previous !== next) {
      URL.revokeObjectURL(previous);
    }
    reducedUrlRef.current = next;
  }, [state.reducedPhoto]);

  // Revoke whatever is still held when the provider unmounts.
  useEffect(() => {
    const photoRefs = photoUrlRef;
    const reducedRefs = reducedUrlRef;
    return () => {
      for (const ref of [photoRefs, reducedRefs]) {
        if (ref.current !== null) {
          URL.revokeObjectURL(ref.current);
          ref.current = null;
        }
      }
    };
  }, []);

  const value = useMemo(() => ({ dispatch, reset, state }), [state, reset]);

  return (
    <CaseSessionContext.Provider value={value}>
      {children}
    </CaseSessionContext.Provider>
  );
}

export function useCaseSession(): CaseSessionContextValue {
  const value = useContext(CaseSessionContext);
  if (value === null) {
    throw new Error("useCaseSession must be used within CaseSessionProvider");
  }
  return value;
}
