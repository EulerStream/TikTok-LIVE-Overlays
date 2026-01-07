import { useInternalWebcast } from "../runtime";
import type { InternalEventEmitter } from "../runtime";

/**
 * Hook to access the internal event emitter.
 * Throws if used outside of an overlay.
 */
export function useWebcast(): InternalEventEmitter {
  const { emitter } = useInternalWebcast();
  return emitter;
}

/**
 * Hook to check if the Webcast connection is available.
 * In the self-contained overlay model, this always returns true.
 */
export function useWebcastConnected(): boolean {
  return true;
}
