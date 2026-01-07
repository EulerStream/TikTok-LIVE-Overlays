import { useState, useEffect, useMemo } from "react";
import { useWebcastConnection } from "../hooks/useWebcastConnection";
import { ConnectionStatus } from "../components/ConnectionStatus";
import { OverlayLoader } from "../components/OverlayLoader";
import { fetchManifest, getDefaultConfig } from "../lib/manifest";

// Allow localhost override with ?t=1 for testing production builds locally
function getApiBaseUrl(): string {
  const params = new URLSearchParams(window.location.search);
  if (params.get("t") === "1") {
    return "http://localhost:3000";
  }
  return import.meta.env.VITE_API_BASE_URL || "https://www.eulerstream.com";
}

const API_BASE_URL = getApiBaseUrl();

interface OverlayConfigResponse {
  title: string;
  icon: string | null;
  bundleBasePath: string;
  jwt: string;
  uniqueId: string;
}

function getOverlayIdFromSubdomain(): string {
  const hostname = window.location.hostname;
  const parts = hostname.split(".");
  if (parts.length >= 3) {
    return parts[0];
  }
  return "";
}

function getOverlayIdFromQuery(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get("overlayId") || "";
}

async function fetchDemoOverlayConfig(overlayId: string): Promise<OverlayConfigResponse> {
  const url = new URL(`${API_BASE_URL}/api/overlays/${overlayId}/config`);
  url.searchParams.set("context", "demo");
  const response = await fetch(url.toString());
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Failed to fetch overlay config: ${response.status}`);
  }
  return response.json();
}

export function DemoPage() {
  // Get overlay ID from subdomain or query param
  const overlayId = getOverlayIdFromSubdomain() || getOverlayIdFromQuery();

  const [overlayConfig, setOverlayConfig] = useState<OverlayConfigResponse | null>(null);
  const [overlayConfigError, setOverlayConfigError] = useState<string | null>(null);
  const [overlayConfigLoading, setOverlayConfigLoading] = useState(true);

  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [configLoaded, setConfigLoaded] = useState(false);

  // Derived values from overlay config
  const bundleUrl = overlayConfig?.bundleBasePath ?? "";
  const jwtKey = overlayConfig?.jwt ?? "";
  const uniqueId = overlayConfig?.uniqueId ?? "";

  // Fetch overlay config with demo context on mount
  useEffect(() => {
    if (!overlayId) {
      setOverlayConfigError("Missing overlay ID");
      setOverlayConfigLoading(false);
      return;
    }

    fetchDemoOverlayConfig(overlayId)
      .then((data) => {
        setOverlayConfig(data);
        setOverlayConfigLoading(false);
      })
      .catch((err) => {
        setOverlayConfigError(err.message);
        setOverlayConfigLoading(false);
      });
  }, [overlayId]);

  // Set favicon and title from overlay config
  useEffect(() => {
    if (!overlayConfig) return;

    // Set favicon if icon is provided
    if (overlayConfig.icon) {
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
      if (link) {
        link.href = overlayConfig.icon;
      }
    }

    // Set page title
    document.title = `Demo | ${overlayConfig.title}`;
  }, [overlayConfig]);

  // Load config from manifest defaults only (no localStorage for demo - prevents abuse)
  useEffect(() => {
    async function loadManifestConfig() {
      if (!bundleUrl) {
        setConfigLoaded(true);
        return;
      }

      try {
        const manifest = await fetchManifest(bundleUrl);
        const defaults = getDefaultConfig(manifest);
        setConfig(defaults);
      } catch {
        // If manifest fails, use empty config
        setConfig({});
      } finally {
        setConfigLoaded(true);
      }
    }

    loadManifestConfig();
  }, [bundleUrl]);

  const { emitter, status, error, retryCountdown, retry } = useWebcastConnection({
    jwtKey,
    uniqueId,
  });

  // Memoize config to prevent unnecessary re-renders
  const stableConfig = useMemo(() => config, [JSON.stringify(config)]);

  // Show overlay config loading state
  if (overlayConfigLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-600 border-t-purple-500" />
          <p className="text-lg text-gray-400">Loading demo...</p>
        </div>
      </div>
    );
  }

  // Show overlay config error
  if (overlayConfigError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl">⚠️</div>
          <p className="mb-2 text-lg text-red-400">{overlayConfigError}</p>
          <p className="text-sm text-gray-500">
            Failed to load demo overlay.
          </p>
        </div>
      </div>
    );
  }

  // Show connection status if not connected
  if (status !== "connected" || !emitter) {
    return (
      <ConnectionStatus
        status={status}
        error={error}
        retryCountdown={retryCountdown}
        onRetry={retry}
      />
    );
  }

  // Wait for config to load
  if (!configLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-muted-foreground">Loading configuration...</p>
        </div>
      </div>
    );
  }

  // Load and render overlay
  if (!bundleUrl) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">No overlay configured</p>
      </div>
    );
  }

  // Demo page: No settings button, just the overlay
  return <OverlayLoader bundleUrl={bundleUrl} emitter={emitter} config={stableConfig} />;
}
