import * as p from "@clack/prompts";
import { setTimeout } from "node:timers/promises";
import pc from "picocolors";
import path from "node:path";
import fs from "node:fs";
import { spawn } from "node:child_process";

const TEMPLATE_REPO = "EulerStream/TikTok-LIVE-Overlays/examples/create-tiktok-overlay";

async function main() {
  console.clear();

  p.intro(pc.bgMagenta(pc.black(" create-tiktok-overlay ")));

  const project = await p.group(
    {
      name: () =>
        p.text({
          message: "What is your overlay called?",
          placeholder: "my-tiktok-overlay",
          validate: (value) => {
            if (!value) return "Please enter a name";
            if (!/^[a-z0-9-]+$/.test(value)) {
              return "Name must be lowercase letters, numbers, and hyphens only";
            }
            if (fs.existsSync(value)) {
              return `Directory "${value}" already exists`;
            }
            return;
          },
        }),

      description: () =>
        p.text({
          message: "Describe your overlay (optional)",
          placeholder: "A cool TikTok LIVE overlay",
        }),

      install: () =>
        p.confirm({
          message: "Install dependencies?",
          initialValue: true,
        }),

      packageManager: ({ results }) =>
        results.install
          ? p.select({
              message: "Which package manager?",
              options: [
                { value: "pnpm", label: "pnpm", hint: "recommended" },
                { value: "npm", label: "npm" },
                { value: "yarn", label: "yarn" },
                { value: "bun", label: "bun" },
              ],
              initialValue: "pnpm",
            })
          : Promise.resolve(null),
    },
    {
      onCancel: () => {
        p.cancel("Operation cancelled.");
        process.exit(0);
      },
    }
  );

  const s = p.spinner();

  // Download template
  s.start("Downloading template...");

  const targetDir = path.resolve(process.cwd(), project.name);

  try {
    // Dynamic import tiged
    const { default: tiged } = await import("tiged");
    const emitter = tiged(TEMPLATE_REPO, {
      disableCache: true,
      force: true,
      verbose: false,
    });

    await emitter.clone(targetDir);
    s.stop("Template downloaded");
  } catch (error) {
    s.stop("Failed to download template");
    p.log.error(
      `Could not download template. Please check your internet connection.\n${error}`
    );
    process.exit(1);
  }

  // Update package.json
  s.start("Configuring project...");
  await setTimeout(300);

  const pkgPath = path.join(targetDir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

  pkg.name = project.name;
  pkg.version = "0.1.0";
  pkg.description = project.description || `${project.name} TikTok LIVE overlay`;
  pkg.private = true;

  // Remove workspace protocol references for standalone project
  if (pkg.dependencies?.["@eulerstream/overlay-sdk"]) {
    pkg.dependencies["@eulerstream/overlay-sdk"] = "latest";
  }
  if (pkg.devDependencies?.["@eulerstream/overlay-cli"]) {
    pkg.devDependencies["@eulerstream/overlay-cli"] = "latest";
  }

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

  // Update manifest.ts with project name
  const manifestPath = path.join(targetDir, "manifest.ts");
  if (fs.existsSync(manifestPath)) {
    let manifest = fs.readFileSync(manifestPath, "utf-8");
    // Could add name to manifest if needed
    fs.writeFileSync(manifestPath, manifest);
  }

  s.stop("Project configured");

  // Install dependencies
  if (project.install && project.packageManager) {
    const pm = project.packageManager as string;
    s.start(`Installing dependencies with ${pm}...`);

    try {
      await runCommand(pm, ["install"], targetDir);
      s.stop("Dependencies installed");
    } catch {
      s.stop("Failed to install dependencies");
      p.log.warn("Could not install dependencies. Run install manually.");
    }
  }

  // Success message
  const relativePath = path.relative(process.cwd(), targetDir);
  const pmDisplay = (project.packageManager as string) || "pnpm";

  p.note(
    [
      `${pc.cyan("cd")} ${relativePath}`,
      !project.install ? `${pc.cyan(pmDisplay)} install` : "",
      `${pc.cyan(pmDisplay)} dev`,
    ]
      .filter(Boolean)
      .join("\n"),
    "Next steps"
  );

  p.outro(
    pc.bgGreen(pc.black(" Happy streaming! ")) +
      " " +
      pc.dim("https://github.com/EulerStream/TikTok-LIVE-Overlays")
  );
}

function runCommand(
  command: string,
  args: string[],
  cwd: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "ignore",
      shell: process.platform === "win32",
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    child.on("error", reject);
  });
}

main().catch((error) => {
  p.log.error(error.message);
  process.exit(1);
});
