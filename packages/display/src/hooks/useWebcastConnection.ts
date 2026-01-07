import { useCallback, useEffect, useRef, useState } from "react";
import {
  ClientCloseCode,
  createWebSocketUrl,
  SchemaVersion,
  WebcastEventEmitter,
} from "@eulerstream/euler-websocket-sdk";
import type { ClientMessageBundle } from "@eulerstream/euler-websocket-sdk";

export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "offline"
  | "error";

interface UseWebcastConnectionOptions {
  jwtKey: string;
  uniqueId: string;
  retryInterval?: number;
}

interface UseWebcastConnectionReturn {
  emitter: WebcastEventEmitter | null;
  status: ConnectionStatus;
  error: string | null;
  retryCountdown: number;
  retry: () => void;
}

export function useWebcastConnection({
  jwtKey,
  uniqueId,
  retryInterval = 30,
}: UseWebcastConnectionOptions): UseWebcastConnectionReturn {
  const [emitter, setEmitter] = useState<WebcastEventEmitter | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [retryCountdown, setRetryCountdown] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const emitterRef = useRef<WebcastEventEmitter | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);
  const connectingRef = useRef(false);
  const mountedRef = useRef(false);
  const intentionalCloseRef = useRef(false);

  const cleanupTimers = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const closeWebSocket = useCallback((intentional = false) => {
    if (wsRef.current) {
      if (intentional) {
        intentionalCloseRef.current = true;
      }
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const startCountdown = useCallback((seconds: number) => {
    setRetryCountdown(seconds);
    countdownRef.current = window.setInterval(() => {
      setRetryCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const connect = useCallback(() => {
    // Skip if already connecting/connected (survives StrictMode double-mount)
    if (connectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    cleanupTimers();
    closeWebSocket(true); // Mark as intentional close for reconnect

    connectingRef.current = true;
    setStatus("connecting");
    setError(null);

    const wsUrl = createWebSocketUrl({
      uniqueId,
      jwtKey,
      features: {
        schemaVersion: SchemaVersion.v2,
        bundleEvents: true,
      },
    });

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    const newEmitter = new WebcastEventEmitter();
    emitterRef.current = newEmitter;

    ws.onopen = () => {
      connectingRef.current = false;
      setStatus("connected");
      setEmitter(newEmitter);
    };

    ws.onmessage = (event) => {
      try {
        const bundle: ClientMessageBundle = JSON.parse(event.data);

        for (const message of bundle.messages) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          newEmitter.emit(message.type as any, message.data as any);
        }
      } catch (err) {
        console.error("Failed to parse message:", err);
      }
    };

    ws.onclose = (event) => {
      connectingRef.current = false;
      setEmitter(null);

      // Don't handle close if we're unmounted or if it was intentional (reconnecting)
      if (!mountedRef.current) return;
      if (intentionalCloseRef.current) {
        intentionalCloseRef.current = false;
        return;
      }

      if (event.code === ClientCloseCode.NOT_LIVE) {
        setStatus("offline");
        setError("Stream is offline");
        startCountdown(retryInterval);
        retryTimeoutRef.current = window.setTimeout(connect, retryInterval * 1000);
      } else if (event.code === ClientCloseCode.INVALID_AUTH) {
        setStatus("error");
        setError("Invalid API key");
      } else {
        setStatus("error");
        setError(`Connection closed: ${event.code}`);
        startCountdown(retryInterval);
        retryTimeoutRef.current = window.setTimeout(connect, retryInterval * 1000);
      }
    };

    ws.onerror = () => {
      connectingRef.current = false;
      if (mountedRef.current) {
        setStatus("error");
        setError("Connection error");
      }
    };
  }, [jwtKey, uniqueId, retryInterval, cleanupTimers, closeWebSocket, startCountdown]);

  const retry = useCallback(() => {
    connectingRef.current = false;
    cleanupTimers();
    closeWebSocket(true); // Intentional close for retry
    connect();
  }, [cleanupTimers, closeWebSocket, connect]);

  useEffect(() => {
    mountedRef.current = true;

    if (jwtKey && uniqueId) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      // Defer cleanup to detect StrictMode vs real unmount
      const ws = wsRef.current;
      const wasConnecting = connectingRef.current;

      setTimeout(() => {
        // If still not mounted after potential StrictMode re-mount, actually cleanup
        if (!mountedRef.current) {
          cleanupTimers();
          if (ws) {
            intentionalCloseRef.current = true; // Don't show error for cleanup
            ws.close();
          }
        }
      }, 0);

      // Reset connecting state so re-mount can connect
      if (wasConnecting) {
        connectingRef.current = false;
      }
    };
  }, [jwtKey, uniqueId, connect, cleanupTimers]);

  return { emitter, status, error, retryCountdown, retry };
}
