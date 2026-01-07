import { useState, useEffect, useRef } from "react";
import type { WebcastEventEmitter } from "@eulerstream/euler-websocket-sdk";
import { loadOverlayScript, mountOverlay, type LoadedOverlay } from "../lib/overlay-loader";

interface OverlayLoaderProps {
  bundleUrl: string;
  emitter: WebcastEventEmitter;
  config?: Record<string, unknown>;
}

/**
 * Loads a self-contained overlay via script injection.
 * The overlay has its own React runtime - no dependency sharing.
 */
export function OverlayLoader({ bundleUrl, emitter, config = {} }: OverlayLoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<LoadedOverlay | null>(null);
  const loadingRef = useRef(false);
  const mountedRef = useRef(false);

  // Store emitter and config in refs so mount effect doesn't re-run when they change
  const emitterRef = useRef(emitter);
  const configRef = useRef(config);
  emitterRef.current = emitter;
  configRef.current = config;

  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Load the script (only once, survives StrictMode double-mount)
  useEffect(() => {
    if (loadingRef.current || scriptLoaded) return;
    loadingRef.current = true;

    async function loadScript() {
      setError(null);

      try {
        await loadOverlayScript(bundleUrl);
        setScriptLoaded(true);
      } catch (err) {
        loadingRef.current = false;
        setError(err instanceof Error ? err.message : "Failed to load overlay");
      }
    }

    void loadScript();
  }, [bundleUrl, scriptLoaded]);

  // Step 2: Mount the overlay once script is loaded and container exists
  useEffect(() => {
    if (!scriptLoaded || !containerRef.current) return;

    // Skip if already mounted (survives StrictMode double-mount)
    if (mountedRef.current) return;
    mountedRef.current = true;

    try {
      overlayRef.current = mountOverlay(
        containerRef.current,
        emitterRef.current,
        configRef.current
      );
    } catch (err) {
      mountedRef.current = false;
      setError(err instanceof Error ? err.message : "Failed to mount overlay");
    }

    return () => {
      // Defer cleanup to detect StrictMode vs real unmount
      const overlay = overlayRef.current;
      mountedRef.current = false;
      overlayRef.current = null;

      setTimeout(() => {
        // If still not mounted after potential StrictMode re-mount, actually unmount
        if (!mountedRef.current && overlay) {
          overlay.handle.unmount();
        }
      }, 0);
    };
  }, [scriptLoaded]); // Only depend on scriptLoaded - emitter/config via refs

  // Update config when it changes (without remounting)
  useEffect(() => {
    overlayRef.current?.handle.updateConfig(config);
  }, [config]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl">!</div>
          <p className="text-lg text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!scriptLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-600 border-t-purple-500" />
          <p className="text-lg text-gray-400">Loading overlay...</p>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="overlay-container min-h-screen" />;
}
