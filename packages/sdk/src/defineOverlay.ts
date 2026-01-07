import {
  OVERLAY_DEFINITION_MARKER,
  type OverlayComponent,
  type OverlayConfig,
  type OverlayDefinition,
} from "./types";
import { createMount } from "./runtime";

/**
 * Dev-time validation errors.
 */
class OverlayValidationError extends Error {
  constructor(message: string) {
    super(`[overlay-sdk] ${message}`);
    this.name = "OverlayValidationError";
  }
}

/**
 * Validates the overlay component.
 * Always runs - bundlers can tree-shake in production if desired.
 */
function validateComponent(component: unknown): asserts component is Function {
  if (typeof component !== "function") {
    throw new OverlayValidationError(
      `defineOverlay expects a function component, received ${typeof component}`
    );
  }
}

/**
 * Defines an overlay for the runtime loader.
 *
 * This is the sole public API of the SDK. Users pass a React function
 * component that receives an `OverlayContext` and returns React elements.
 *
 * The overlay is self-contained with its own React runtime. The host
 * communicates via a narrow contract: `window.Overlay.mount(container, props)`.
 *
 * @example
 * ```tsx
 * import { defineOverlay } from "@eulerstream/overlay-sdk";
 *
 * export default defineOverlay(({ config }) => {
 *   return <h1 style={{ color: config.color }}>{config.title}</h1>;
 * });
 * ```
 *
 * @example With typed config
 * ```tsx
 * import { defineOverlay } from "@eulerstream/overlay-sdk";
 *
 * interface MyConfig {
 *   title: string;
 *   color: string;
 * }
 *
 * export default defineOverlay<MyConfig>(({ config }) => {
 *   return <h1 style={{ color: config.color }}>{config.title}</h1>;
 * });
 * ```
 */
export function defineOverlay<TConfig extends OverlayConfig = OverlayConfig>(
  component: OverlayComponent<TConfig>
): OverlayDefinition<TConfig> {
  // Validate component (lightweight, always runs)
  validateComponent(component);

  // Create mount function for self-contained IIFE bundles
  const mount = createMount(component);

  // Attach to window.Overlay for script-tag loading
  if (typeof window !== "undefined") {
    if (!window.Overlay) {
      window.Overlay = { mount };
    } else {
      window.Overlay.mount = mount;
    }
  }

  // Return frozen definition
  return Object.freeze({
    __marker: OVERLAY_DEFINITION_MARKER,
    component,
  });
}
