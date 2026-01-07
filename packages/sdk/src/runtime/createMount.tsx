import React, {type ReactNode, useEffect, useState} from "react";
import {createRoot, type Root} from "react-dom/client";
import {InternalEventEmitter} from "./InternalEventEmitter";
import {InternalWebcastContext} from "./InternalWebcastContext";
import type {OverlayComponent, OverlayConfig} from "../types";
import type {OverlayHandle, OverlayMountProps} from "./contract";

interface OverlayWrapperProps<TConfig extends OverlayConfig> {
  Component: OverlayComponent<TConfig>;
  emitter: InternalEventEmitter;
  initialConfig: TConfig;
  configRef: { current: TConfig };
}

function OverlayWrapper<TConfig extends OverlayConfig>({
  Component,
  emitter,
  initialConfig,
  configRef,
}: OverlayWrapperProps<TConfig>): ReactNode {
  const [config, setConfig] = useState<TConfig>(initialConfig);

  // Expose setConfig to parent via ref-like pattern
  useEffect(() => {
    (configRef as { current: TConfig; update?: (c: TConfig) => void }).update =
      (newConfig: TConfig) => setConfig(newConfig);
  }, [configRef]);

  return (
    <InternalWebcastContext.Provider value={{ emitter, config }}>
      <Component config={config} />
    </InternalWebcastContext.Provider>
  );
}

/**
 * Creates a mount function for a self-contained overlay.
 */
export function createMount<TConfig extends OverlayConfig>(
  Component: OverlayComponent<TConfig>
): (container: HTMLElement, props: OverlayMountProps) => OverlayHandle {
  return (container: HTMLElement, props: OverlayMountProps): OverlayHandle => {
    const emitter = new InternalEventEmitter();
    let root: Root | null = createRoot(container);
    const configRef: { current: TConfig; update?: (c: TConfig) => void } = {
      current: props.config as TConfig,
    };

    // Subscribe to events from host
    const unsubscribe = props.subscribeToEvents((eventName, data) => {
      emitter.emit(eventName, data);
    });

    // Initial render
    root.render(
      <OverlayWrapper
        Component={Component}
        emitter={emitter}
        initialConfig={props.config as TConfig}
        configRef={configRef}
      />
    );

    return {
      unmount: () => {
        unsubscribe();
        root?.unmount();
        root = null;
      },
      updateConfig: (newConfig: Record<string, unknown>) => {
        configRef.current = newConfig as TConfig;
        configRef.update?.(newConfig as TConfig);
      },
    };
  };
}
