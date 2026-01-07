import * as fs from "node:fs";
import * as path from "node:path";
import * as esbuild from "esbuild";

interface ManifestOptions {
  input: string;
  output: string;
}

export async function manifestCommand(options: ManifestOptions) {
  const inputPath = path.resolve(process.cwd(), options.input);
  const outputPath = path.resolve(process.cwd(), options.output);

  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Manifest file not found: ${inputPath}`);
    process.exit(1);
  }

  console.log(`Compiling manifest from ${inputPath}...`);

  try {
    // Bundle the manifest.ts including the SDK (defineManifest is just an identity function)
    const result = await esbuild.build({
      entryPoints: [inputPath],
      bundle: true,
      write: false,
      format: "esm",
      platform: "node",
      target: "node18",
      // Bundle everything - no externals needed for manifest
    });

    // Execute the bundled code to get the manifest object
    const code = result.outputFiles[0].text;

    // Create a temporary module to execute
    const tempFile = path.join(path.dirname(outputPath), ".manifest-temp.mjs");
    fs.writeFileSync(tempFile, code);

    try {
      const module = await import(`file://${tempFile}`);
      const manifest = module.default;

      if (!manifest || typeof manifest !== "object") {
        throw new Error("Manifest must export a default object");
      }

      // Write the JSON
      fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
      console.log(`Manifest written to ${outputPath}`);
    } finally {
      // Clean up temp file
      fs.unlinkSync(tempFile);
    }
  } catch (error) {
    console.error("Error compiling manifest:", error);
    process.exit(1);
  }
}
