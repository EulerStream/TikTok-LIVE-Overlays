export interface ConfigOption {
  key: string;
  type: "string" | "number" | "color" | "boolean";
  label: string;
  default: string | number | boolean;
  min?: number;
  max?: number;
}

export interface ConfigGroup {
  label: string;
  options: ConfigOption[];
}

export interface OverlayManifest {
  config?: Record<string, ConfigGroup>;
}

export async function fetchManifest(bundleUrl: string): Promise<OverlayManifest> {
  const manifestUrl = bundleUrl.endsWith(".js")
    ? bundleUrl.replace(/\.js$/, "/manifest.json")
    : `${bundleUrl}/manifest.json`;

  const response = await fetch(manifestUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch manifest: ${response.status}`);
  }
  return response.json();
}

export function getDefaultConfig(manifest: OverlayManifest): Record<string, unknown> {
  const config: Record<string, unknown> = {};

  if (!manifest.config) return config;

  for (const group of Object.values(manifest.config)) {
    for (const option of group.options) {
      config[option.key] = option.default;
    }
  }

  return config;
}
