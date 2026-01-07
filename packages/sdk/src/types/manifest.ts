/**
 * Manifest types for overlay configuration.
 */

export type ConfigOptionType = "string" | "number" | "color";

export interface ConfigOptionBase {
  key: string;
  label: string;
  description?: string;
}

export interface StringConfigOption extends ConfigOptionBase {
  type: "string";
  default?: string;
  placeholder?: string;
  maxLength?: number;
}

export interface NumberConfigOption extends ConfigOptionBase {
  type: "number";
  default?: number;
  min?: number;
  max?: number;
  step?: number;
}

export interface ColorConfigOption extends ConfigOptionBase {
  type: "color";
  default?: string;
}

export type ConfigOption =
  | StringConfigOption
  | NumberConfigOption
  | ColorConfigOption;

export interface ConfigCategory {
  label: string;
  description?: string;
  options: ConfigOption[];
}

export interface OverlayManifest {
  config?: Record<string, ConfigCategory>;
}

export function defineManifest(manifest: OverlayManifest): OverlayManifest {
  return manifest;
}
