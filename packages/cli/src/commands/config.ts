import { setToken, loadConfig } from "../lib/config";
import * as path from "node:path";
import * as os from "node:os";

const CONFIG_FILE = path.join(os.homedir(), ".eulerstream", "config.json");

export function setTokenCommand(token: string) {
  if (!token || token.trim() === "") {
    console.error("Error: Token cannot be empty.");
    process.exit(1);
  }

  setToken(token.trim());
  console.log("CLI token saved successfully.");
  console.log(`Config file: ${CONFIG_FILE}`);
}

export function showConfigCommand() {
  const config = loadConfig();

  console.log("Current configuration:");
  console.log(`  Config file: ${CONFIG_FILE}`);

  if (config.token) {
    // Show masked token
    const masked =
      config.token.length > 8
        ? config.token.slice(0, 4) + "..." + config.token.slice(-4)
        : "****";
    console.log(`  Token: ${masked}`);
  } else {
    console.log("  Token: (not set)");
  }

  if (process.env.EULER_CLI_TOKEN) {
    console.log("  Note: EULER_CLI_TOKEN env var is set (takes precedence)");
  }
}
