import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  fetchManifest,
  getDefaultConfig,
  type OverlayManifest,
  type ConfigOption,
} from "@/lib/manifest";
import { loadConfig, saveConfig, mergeWithDefaults } from "@/lib/config-storage";

// Allow localhost override with ?t=1 for testing production builds locally
function getApiBaseUrl(): string {
  const params = new URLSearchParams(window.location.search);
  if (params.get("t") === "1") {
    return "http://localhost:3000";
  }
  return import.meta.env.VITE_API_BASE_URL || "https://www.eulerstream.com";
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

interface OverlayConfigResponse {
  title: string;
  icon: string | null;
  bundleBasePath: string;
  jwt: string;
  uniqueId: string;
}

async function fetchOverlayConfig(overlayId: string, token: string): Promise<OverlayConfigResponse> {
  const API_BASE_URL = getApiBaseUrl();
  const url = new URL(`${API_BASE_URL}/api/overlays/${overlayId}/config`);
  url.searchParams.set("token", token);
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to fetch overlay config: ${response.status}`);
  }
  return response.json();
}

function ConfigField({
  option,
  value,
  onChange,
}: {
  option: ConfigOption;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  switch (option.type) {
    case "color":
      return (
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={String(value)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
            className="h-10 w-14 cursor-pointer rounded border border-border bg-transparent"
          />
          <Input
            type="text"
            value={String(value)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
            className="flex-1"
          />
        </div>
      );

    case "number":
      if (option.min !== undefined && option.max !== undefined) {
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Slider
                value={[Number(value)]}
                onValueChange={(values: number[]) => onChange(values[0])}
                min={option.min}
                max={option.max}
                step={1}
                className="flex-1"
              />
              <span className="ml-4 w-12 text-right text-sm text-muted-foreground">
                {String(value)}
              </span>
            </div>
          </div>
        );
      }
      return (
        <Input
          type="number"
          value={Number(value)}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
          min={option.min}
          max={option.max}
        />
      );

    case "boolean":
      return (
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          <span className="text-sm text-muted-foreground">Enabled</span>
        </label>
      );

    case "string":
    default:
      return (
        <Input
          type="text"
          value={String(value)}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        />
      );
  }
}

export function ConfigPage() {
  const navigate = useNavigate();

  // Get overlay ID and token from URL
  const overlayId = getOverlayIdFromSubdomain() || getOverlayIdFromQuery();
  const token = getTokenFromQuery();

  const [manifest, setManifest] = useState<OverlayManifest | null>(null);
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      if (!overlayId || !token) {
        setError("Missing overlay ID or token");
        setLoading(false);
        return;
      }

      try {
        // First fetch overlay config to get bundleBasePath
        const overlayConfig = await fetchOverlayConfig(overlayId, token);
        const bundleUrl = overlayConfig.bundleBasePath;

        if (!bundleUrl) {
          setError("No bundle URL configured");
          setLoading(false);
          return;
        }

        // Then fetch manifest from bundle
        const manifestData = await fetchManifest(bundleUrl);
        setManifest(manifestData);

        const defaults = getDefaultConfig(manifestData);
        const stored = loadConfig();
        setConfig(mergeWithDefaults(stored, defaults));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load configuration");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [overlayId, token]);

  const handleChange = (key: string, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    saveConfig(config);
    setSaved(true);
  };

  const handleSaveAndView = () => {
    saveConfig(config);
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-muted-foreground">Loading configuration...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-destructive">{error}</p>
          <Button onClick={() => navigate("/")} className="mt-4" variant="secondary">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!manifest?.config) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">This overlay has no configurable options.</p>
          <Button onClick={() => navigate("/")} className="mt-4" variant="secondary">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Overlay Configuration</h1>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/")} variant="secondary">
              Cancel
            </Button>
            <Button onClick={handleSave} variant="secondary">
              {saved ? "Saved!" : "Save"}
            </Button>
            <Button onClick={handleSaveAndView}>Save & View</Button>
          </div>
        </div>

        <div className="space-y-6">
          {Object.entries(manifest.config).map(([groupKey, group]) => (
            <Card key={groupKey}>
              <CardHeader>
                <CardTitle>{group.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {group.options.map((option) => (
                  <div key={option.key} className="space-y-2">
                    <Label htmlFor={option.key}>{option.label}</Label>
                    <ConfigField
                      option={option}
                      value={config[option.key]}
                      onChange={(value) => handleChange(option.key, value)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
