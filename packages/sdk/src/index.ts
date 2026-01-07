/**
 * @eulerstream/overlay-sdk
 *
 * SDK for building self-contained React overlays for TikTok Live.
 * Overlays are IIFE bundles with React baked in, loaded via script tag.
 */

// Main API
export { defineOverlay } from "./defineOverlay";

// Types - Overlay
export type {
  OverlayConfig,
  OverlayContext,
  OverlayComponent,
  OverlayDefinition,
} from "./types";
export { isOverlayDefinition, OVERLAY_DEFINITION_MARKER } from "./types";

// Types - Manifest
export type {
  OverlayManifest,
  ConfigCategory,
  ConfigOption,
  ConfigOptionType,
  StringConfigOption,
  NumberConfigOption,
  ColorConfigOption,
} from "./types";
export { defineManifest } from "./types";

// Types - Contract (for host implementations)
export type {
  OverlayMountProps,
  OverlayHandle,
  OverlayMountFunction,
  WebcastEventCallback,
} from "./runtime";

// Hooks (includes generated hooks for all event types)
export * from "./hooks";
