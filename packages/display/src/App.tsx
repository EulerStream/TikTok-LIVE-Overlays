import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useWebcastConnection } from "./hooks/useWebcastConnection";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { OverlayLoader } from "./components/OverlayLoader";
import { fetchManifest, getDefaultConfig } from "./lib/manifest";
import { loadConfig, mergeWithDefaults } from "./lib/config-storage";
import { Settings } from "lucide-react";

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

function getTokenFromQuery(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get("token") || "";
}

function getOverlayIdFromQuery(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get("overlayId") || "";
}

async function fetchOverlayConfig(overlayId: string, token: string): Promise<OverlayConfigResponse> {
  const url = new URL(`${API_BASE_URL}/api/overlays/${overlayId}/config`);
  url.searchParams.set("token", token);
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to fetch overlay config: ${response.status}`);
  }
  return response.json();
}

function App() {
  const navigate = useNavigate();

  // Get overlay ID from subdomain or query param
  const overlayId = getOverlayIdFromSubdomain() || getOverlayIdFromQuery();
  const token = getTokenFromQuery();

  const [overlayConfig, setOverlayConfig] = useState<OverlayConfigResponse | null>(null);
  const [overlayConfigError, setOverlayConfigError] = useState<string | null>(null);
  const [overlayConfigLoading, setOverlayConfigLoading] = useState(true);

  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [configLoaded, setConfigLoaded] = useState(false);

  // Derived values from overlay config
  const bundleUrl = overlayConfig?.bundleBasePath ?? "";
  const jwtKey = overlayConfig?.jwt ?? "";
  const uniqueId = overlayConfig?.uniqueId ?? "";

  // Fetch overlay config (includes JWT) on mount
  useEffect(() => {
    if (!overlayId || !token) {
      setOverlayConfigError("Missing overlay ID or token");
      setOverlayConfigLoading(false);
      return;
    }

    fetchOverlayConfig(overlayId, token)
      .then((data) => {
        setOverlayConfig(data);
        setOverlayConfigLoading(false);
      })
      .catch((err) => {
        setOverlayConfigError(err.message);
        setOverlayConfigLoading(false);
      });
  }, [overlayId, token]);

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
    document.title = `Euler Overlay | ${overlayConfig.title}`;
  }, [overlayConfig]);

  // Load config from localStorage merged with manifest defaults
  useEffect(() => {
    async function loadManifestConfig() {
      if (!bundleUrl) {
        setConfigLoaded(true);
        return;
      }

      try {
        const manifest = await fetchManifest(bundleUrl);
        const defaults = getDefaultConfig(manifest);
        const stored = loadConfig();
        setConfig(mergeWithDefaults(stored, defaults));
      } catch {
        // If manifest fails, just use stored config
        setConfig(loadConfig());
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

  // Settings button overlay
  const settingsButton = (
    <button
      onClick={() => navigate("/config")}
      className="fixed right-4 top-4 z-50 rounded-lg bg-black/50 p-2 text-white/70 transition-colors hover:bg-black/70 hover:text-white"
      title="Configure overlay"
    >
      <Settings className="h-5 w-5" />
    </button>
  );

  // Show overlay config loading state
  if (overlayConfigLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-600 border-t-purple-500" />
          <p className="text-lg text-gray-400">Loading overlay...</p>
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
            Failed to load overlay configuration.
          </p>
        </div>
      </div>
    );
  }

  // Show connection status if not connected
  if (status !== "connected" || !emitter) {
    return (
      <>
        {settingsButton}
        <ConnectionStatus
          status={status}
          error={error}
          retryCountdown={retryCountdown}
          onRetry={retry}
        />
      </>
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
      <>
        {settingsButton}
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-gray-400">No overlay configured</p>
        </div>
      </>
    );
  }

  return (
    <>
      {settingsButton}
      <OverlayLoader bundleUrl={bundleUrl} emitter={emitter} config={stableConfig} />
    </>
  );
}

export default App;
