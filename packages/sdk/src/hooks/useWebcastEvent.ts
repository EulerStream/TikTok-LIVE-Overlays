import { useEffect, useState } from "react";
import type {
  WebcastEventName,
  WebcastMessageMap,
} from "@eulerstream/euler-websocket-sdk";
import { useWebcast } from "./useWebcast";

/**
 * Hook to subscribe to a specific Webcast event type.
 */
export function useWebcastEvent<K extends WebcastEventName>(
  eventName: K
): WebcastMessageMap[K] | null {
  const emitter = useWebcast();
  const [event, setEvent] = useState<WebcastMessageMap[K] | null>(null);

  useEffect(() => {
    const handler = (data: unknown) => setEvent(data as WebcastMessageMap[K]);
    emitter.on(eventName, handler);
    return () => emitter.off(eventName, handler);
  }, [emitter, eventName]);

  return event;
}

/**
 * Hook to subscribe to a Webcast event and keep a history.
 */
export function useWebcastEventHistory<K extends WebcastEventName>(
  eventName: K,
  maxHistory: number = 100
): WebcastMessageMap[K][] {
  const emitter = useWebcast();
  const [events, setEvents] = useState<WebcastMessageMap[K][]>([]);

  useEffect(() => {
    const handler = (data: unknown) => {
      setEvents((prev) => {
        const next = [...prev, data as WebcastMessageMap[K]];
        return next.length > maxHistory ? next.slice(-maxHistory) : next;
      });
    };

    emitter.on(eventName, handler);
    return () => emitter.off(eventName, handler);
  }, [emitter, eventName, maxHistory]);

  return events;
}
