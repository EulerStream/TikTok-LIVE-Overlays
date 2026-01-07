#!/usr/bin/env node
import { program } from "commander";
import { manifestCommand } from "./commands/manifest";
import { bundleCommand } from "./commands/bundle";
import { generateHooksCommand } from "./commands/generate-hooks";
import { uploadCommand } from "./commands/upload";
import { setTokenCommand, showConfigCommand } from "./commands/config";

program
  .name("overlay-cli")
  .description("CLI for building TikTok Live overlays")
  .version("0.1.0");

program
  .command("manifest")
  .description("Compile manifest.ts to manifest.json")
  .option("-i, --input <path>", "Input manifest.ts path", "./manifest.ts")
  .option("-o, --output <path>", "Output manifest.json path", "./dist/manifest.json")
  .action(manifestCommand);

program
  .command("bundle")
  .description("Bundle overlay into bundle.zip")
  .option("-e, --entry <path>", "Entry file path", "./src/index.ts")
  .option("-m, --manifest <path>", "Manifest file path", "./manifest.ts")
  .option("-o, --output <path>", "Output directory", "./dist")
  .option("-p, --public <path>", "Public assets directory", "./public")
  .action(bundleCommand);

program
  .command("upload <overlayId> <zipPath>")
  .description("Upload overlay bundle to Eulerstream")
  .option("-h, --host <url>", "API host URL override")
  .action(uploadCommand);

// Config commands
const config = program
  .command("config")
  .description("Manage CLI configuration");

config
  .command("set-token <token>")
  .description("Save CLI token to config file")
  .action(setTokenCommand);

config
  .command("show")
  .description("Show current configuration")
  .action(showConfigCommand);

// Dev commands (internal tools)
const dev = program
  .command("dev")
  .description("Internal development tools");

dev
  .command("generate-hooks")
  .description("Generate SDK hooks from WebcastEventName types")
  .option("-o, --output <path>", "Output directory", "./packages/sdk/src/hooks/generated")
  .action(generateHooksCommand);

program.parse();
