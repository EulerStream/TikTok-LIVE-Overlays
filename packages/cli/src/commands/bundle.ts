import * as fs from "node:fs";
import * as path from "node:path";
import * as esbuild from "esbuild";
import archiver from "archiver";
import { manifestCommand } from "./manifest";

interface BundleOptions {
  entry: string;
  manifest: string;
  output: string;
  public: string;
}

export async function bundleCommand(options: BundleOptions) {
  const entryPath = path.resolve(process.cwd(), options.entry);
  const manifestPath = path.resolve(process.cwd(), options.manifest);
  const outputDir = path.resolve(process.cwd(), options.output);
  const publicDir = path.resolve(process.cwd(), options.public);

  if (!fs.existsSync(entryPath)) {
    console.error(`Error: Entry file not found: ${entryPath}`);
    process.exit(1);
  }

  // Create output directory
  fs.mkdirSync(outputDir, { recursive: true });

  console.log("Building overlay bundle...");

  try {
    // 1. Build the JavaScript bundle as self-contained IIFE
    console.log("  Bundling JavaScript (IIFE with React)...");
    const jsResult = await esbuild.build({
      entryPoints: [entryPath],
      bundle: true,
      outfile: path.join(outputDir, "index.js"),
      format: "iife",
      globalName: "_OverlayInternal",
      platform: "browser",
      target: "es2020",
      jsx: "automatic",
      jsxImportSource: "react",
      // NO externals - bundle everything including React
      external: [],
      minify: true,
      sourcemap: true,
      define: {
        "process.env.NODE_ENV": '"production"',
      },
    });

    if (jsResult.errors.length > 0) {
      console.error("Build errors:", jsResult.errors);
      process.exit(1);
    }

    // 2. Compile manifest if exists
    if (fs.existsSync(manifestPath)) {
      console.log("  Compiling manifest...");
      await manifestCommand({
        input: options.manifest,
        output: path.join(outputDir, "manifest.json"),
      });
    } else {
      // Create empty manifest
      fs.writeFileSync(
        path.join(outputDir, "manifest.json"),
        JSON.stringify({}, null, 2)
      );
    }

    // 3. Copy public assets to output root (not a subfolder)
    if (fs.existsSync(publicDir)) {
      console.log("  Copying public assets...");
      copyDir(publicDir, outputDir);
    }

    // 4. Create bundle.zip
    console.log("  Creating bundle.zip...");
    await createZip(outputDir, path.join(outputDir, "bundle.zip"));

    console.log(`\nBundle created at: ${outputDir}`);
    console.log("Files:");
    listFiles(outputDir, "  ");
  } catch (error) {
    console.error("Error bundling overlay:", error);
    process.exit(1);
  }
}

// Files to exclude from bundle (system files)
const EXCLUDED_FILES = new Set([".DS_Store", "Thumbs.db", ".gitkeep", "desktop.ini"]);

function shouldExclude(name: string): boolean {
  return EXCLUDED_FILES.has(name);
}

function copyDir(src: string, dest: string) {
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    if (shouldExclude(entry.name)) continue;

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function listFiles(dir: string, prefix: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === "bundle.zip" || shouldExclude(entry.name)) continue;

    if (entry.isDirectory()) {
      console.log(`${prefix}${entry.name}/`);
      listFiles(path.join(dir, entry.name), prefix + "  ");
    } else {
      const filePath = path.join(dir, entry.name);
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      console.log(`${prefix}${entry.name} (${sizeKB} KB)`);
    }
  }
}

async function createZip(sourceDir: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      const sizeKB = (archive.pointer() / 1024).toFixed(1);
      console.log(`  bundle.zip created (${sizeKB} KB)`);
      resolve();
    });

    archive.on("error", reject);
    archive.pipe(output);

    // Add all files except the zip itself and excluded files
    const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "bundle.zip" || shouldExclude(entry.name)) continue;

      const entryPath = path.join(sourceDir, entry.name);
      if (entry.isDirectory()) {
        archive.directory(entryPath, entry.name);
      } else {
        archive.file(entryPath, { name: entry.name });
      }
    }

    archive.finalize();
  });
}
