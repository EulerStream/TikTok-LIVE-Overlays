import { createContext, useContext } from "react";
import type { InternalEventEmitter } from "./InternalEventEmitter";

export interface InternalWebcastContextValue {
  emitter: InternalEventEmitter;
  config: Record<string, unknown>;
}

export const InternalWebcastContext =
  createContext<InternalWebcastContextValue | null>(null);

export function useInternalWebcast(): InternalWebcastContextValue {
  const ctx = useContext(InternalWebcastContext);
  if (!ctx) {
    throw new Error("useInternalWebcast must be used within an overlay");
  }
  return ctx;
}
