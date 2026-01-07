import * as fs from "node:fs";
import * as path from "node:path";
import { getToken, getApiHost } from "../lib/config";

interface UploadOptions {
  host?: string;
}

interface UploadSuccessResponse {
  ok: true;
  versionId: string;
  filesUploaded: number;
}

interface UploadErrorResponse {
  error: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadCommand(
  overlayId: string,
  zipPath: string,
  options: UploadOptions
) {
  const resolvedPath = path.resolve(process.cwd(), zipPath);
  const apiHost = getApiHost(options.host);
  const token = getToken();

  // Validate token exists
  if (!token) {
    console.error("Error: No CLI token configured.");
    console.error("Set it with: overlay-cli config set-token <token>");
    console.error("Or set the EULER_CLI_TOKEN environment variable.");
    process.exit(1);
  }

  // Validate file exists
  if (!fs.existsSync(resolvedPath)) {
    console.error(`Error: File not found: ${resolvedPath}`);
    process.exit(1);
  }

  // Check file size
  const stats = fs.statSync(resolvedPath);
  if (stats.size > MAX_FILE_SIZE) {
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.error(`Error: File too large (${sizeMB}MB). Maximum size is 10MB.`);
    process.exit(1);
  }

  // Read file
  const fileBuffer = fs.readFileSync(resolvedPath);
  const sizeKB = (fileBuffer.length / 1024).toFixed(1);

  console.log(`Uploading ${path.basename(resolvedPath)} (${sizeKB} KB)...`);

  try {
    const url = `${apiHost}/api/overlays/${overlayId}/cli-upload`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/zip",
      },
      body: fileBuffer,
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as UploadErrorResponse;
      const errorMessage = data.error || `Upload failed with status ${response.status}`;

      if (response.status === 401) {
        console.error(`Error: ${errorMessage}`);
        console.error("Please check your CLI token.");
      } else if (response.status === 404) {
        console.error(`Error: ${errorMessage}`);
      } else if (response.status === 413) {
        console.error(`Error: ${errorMessage}`);
      } else if (response.status === 400) {
        console.error(`Error: ${errorMessage}`);
      } else {
        console.error(`Error: ${errorMessage}`);
      }

      process.exit(1);
    }

    const data = (await response.json()) as UploadSuccessResponse;

    console.log("\nUpload successful!");
    console.log(`  Version ID: ${data.versionId}`);
    console.log(`  Files uploaded: ${data.filesUploaded}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error("Error: Upload failed");
    }
    process.exit(1);
  }
}
