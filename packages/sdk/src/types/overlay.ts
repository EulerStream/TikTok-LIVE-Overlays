import type { ReactNode } from "react";

/**
 * User-defined configuration object passed to the overlay at runtime.
 * The runtime loader injects this based on user settings.
 */
export type OverlayConfig = Record<string, unknown>;

/**
 * Context provided to the overlay component by the runtime.
 */
export interface OverlayContext<TConfig extends OverlayConfig = OverlayConfig> {
  /**
   * User-defined configuration values injected by the runtime.
   */
  readonly config: TConfig;
}

/**
 * The overlay component function signature.
 * Receives context from the runtime and returns React elements.
 */
export type OverlayComponent<TConfig extends OverlayConfig = OverlayConfig> = (
  context: OverlayContext<TConfig>
) => ReactNode;

/**
 * Internal marker to identify valid overlay definitions.
 * Used by the runtime loader to verify the module shape.
 */
export const OVERLAY_DEFINITION_MARKER = Symbol.for("@eulerstream/overlay-sdk");

/**
 * Internal overlay definition shape consumed by the runtime loader.
 * This is the return type of `defineOverlay`.
 */
export interface OverlayDefinition<
  TConfig extends OverlayConfig = OverlayConfig,
> {
  /**
   * Internal marker for runtime validation.
   * @internal
   */
  readonly __marker: typeof OVERLAY_DEFINITION_MARKER;

  /**
   * The overlay component to render.
   * @internal
   */
  readonly component: OverlayComponent<TConfig>;
}

/**
 * Type guard to check if a value is a valid OverlayDefinition.
 * Used by the runtime loader to validate imported modules.
 */
export function isOverlayDefinition(
  value: unknown
): value is OverlayDefinition {
  return (
    typeof value === "object" &&
    value !== null &&
    "__marker" in value &&
    (value as OverlayDefinition).__marker === OVERLAY_DEFINITION_MARKER &&
    "component" in value &&
    typeof (value as OverlayDefinition).component === "function"
  );
}
