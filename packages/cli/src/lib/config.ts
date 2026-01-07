import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

const CONFIG_DIR = path.join(os.homedir(), ".eulerstream");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export const DEFAULT_API_HOST = "https://www.eulerstream.com";

interface Config {
  token?: string;
}

export function loadConfig(): Config {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch {
    // Ignore errors, return empty config
  }
  return {};
}

export function saveConfig(config: Config): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function getToken(): string | undefined {
  // Environment variable takes precedence
  if (process.env.EULER_CLI_TOKEN) {
    return process.env.EULER_CLI_TOKEN;
  }
  return loadConfig().token;
}

export function setToken(token: string): void {
  const config = loadConfig();
  config.token = token;
  saveConfig(config);
}

export function getApiHost(hostOption?: string): string {
  return hostOption || process.env.EULER_API_HOST || DEFAULT_API_HOST;
}
