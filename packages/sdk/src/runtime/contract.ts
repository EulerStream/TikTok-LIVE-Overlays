/**
 * Narrow contract between host (display) and overlay.
 * This is the only interface that crosses the isolation boundary.
 */

/**
 * Callback signature for receiving webcast events
 */
export type WebcastEventCallback = (
  eventName: string,
  data: unknown
) => void;

/**
 * Props passed to the overlay's mount function
 */
export interface OverlayMountProps {
  /**
   * Configuration object (plain JSON)
   */
  config: Record<string, unknown>;

  /**
   * Subscribe to webcast events. Returns unsubscribe function.
   */
  subscribeToEvents: (callback: WebcastEventCallback) => () => void;
}

/**
 * Handle returned by mount for lifecycle control
 */
export interface OverlayHandle {
  /**
   * Unmount the overlay and clean up
   */
  unmount: () => void;

  /**
   * Update configuration at runtime
   */
  updateConfig: (config: Record<string, unknown>) => void;
}

/**
 * The mount function signature exposed by self-contained overlays
 */
export type OverlayMountFunction = (
  container: HTMLElement,
  props: OverlayMountProps
) => OverlayHandle;

/**
 * Global namespace for the overlay
 */
declare global {
  interface Window {
    Overlay?: {
      mount: OverlayMountFunction;
      manifest?: Record<string, unknown>;
    };
  }
}
