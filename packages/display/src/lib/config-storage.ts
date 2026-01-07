const STORAGE_KEY = "overlay-config";

export function loadConfig(): Record<string, unknown> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return {};
}

export function saveConfig(config: Record<string, unknown>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function mergeWithDefaults(
  stored: Record<string, unknown>,
  defaults: Record<string, unknown>
): Record<string, unknown> {
  return { ...defaults, ...stored };
}
