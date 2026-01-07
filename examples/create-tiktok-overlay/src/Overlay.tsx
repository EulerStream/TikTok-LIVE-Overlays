import { useState, useCallback, useEffect, useRef } from "react";
import type { OverlayContext } from "@eulerstream/overlay-sdk";
import { useWebcastMemberMessage } from "@eulerstream/overlay-sdk";
import { JoinNotification } from "./components/JoinNotification";

interface JoinEvent {
  id: string;
  nickname: string;
  profileUrl: string;
}

export function Overlay({ config }: OverlayContext) {
  const fadeIn = (config.fadeIn as number) || 500;
  const fadeOut = (config.fadeOut as number) || 500;
  const displayTime = (config.displayTime as number) || 3000;
  const fontSize = (config.fontSize as number) || 48;
  const imageSize = (config.imageSize as number) || 200;

  const [queue, setQueue] = useState<JoinEvent[]>([]);
  const [current, setCurrent] = useState<JoinEvent | null>(null);
  const processingRef = useRef(false);
  const lastEventIdRef = useRef<string | null>(null);

  // Get latest member message
  const memberMessage = useWebcastMemberMessage();

  // Add to queue when new member joins
  useEffect(() => {
    if (!memberMessage) return;

    const user = memberMessage.user;
    if (!user) return;

    // Create unique ID for this event
    const eventId = `${user.userId}-${Date.now()}`;

    // Skip if same as last processed event (debounce)
    if (lastEventIdRef.current === eventId) return;
    lastEventIdRef.current = eventId;

    const profilePicUrl = user.profilePicture?.url;
    const profileUrl = Array.isArray(profilePicUrl) ? profilePicUrl[0] : (profilePicUrl || "");

    const joinEvent: JoinEvent = {
      id: eventId,
      nickname: user.nickname || user.uniqueId || "Anonymous",
      profileUrl,
    };

    setQueue((q) => [...q, joinEvent]);
  }, [memberMessage]);

  // Process queue
  useEffect(() => {
    if (current || queue.length === 0 || processingRef.current) return;

    processingRef.current = true;
    const next = queue[0];
    setQueue((q) => q.slice(1));
    setCurrent(next);
    processingRef.current = false;
  }, [queue, current]);

  const handleComplete = useCallback(() => {
    setCurrent(null);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {current && (
        <JoinNotification
          key={current.id}
          nickname={current.nickname}
          profileUrl={current.profileUrl}
          onComplete={handleComplete}
          fadeIn={fadeIn}
          fadeOut={fadeOut}
          displayTime={displayTime}
          fontSize={fontSize}
          imageSize={imageSize}
        />
      )}
    </div>
  );
}
