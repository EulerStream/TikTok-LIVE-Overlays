import React, { useState, useEffect } from "react";

interface JoinNotificationProps {
  nickname: string;
  profileUrl: string;
  onComplete: () => void;
  fadeIn: number;
  fadeOut: number;
  displayTime: number;
  fontSize: number;
  imageSize: number;
}

export function JoinNotification({
  nickname,
  profileUrl,
  onComplete,
  fadeIn,
  fadeOut,
  displayTime,
  fontSize,
  imageSize,
}: JoinNotificationProps) {
  const [phase, setPhase] = useState<"fadein" | "display" | "fadeout">("fadein");

  useEffect(() => {
    // Fade in
    const displayTimer = setTimeout(() => {
      setPhase("display");
    }, fadeIn);

    // Start fade out
    const fadeOutTimer = setTimeout(() => {
      setPhase("fadeout");
    }, fadeIn + displayTime);

    // Complete
    const completeTimer = setTimeout(() => {
      onComplete();
    }, fadeIn + displayTime + fadeOut);

    return () => {
      clearTimeout(displayTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
    };
  }, [fadeIn, fadeOut, displayTime, onComplete]);

  return (
    <div
      className="join-notification"
      data-phase={phase}
      style={{
        "--image-size": `${imageSize}px`,
        "--font-size": `${fontSize}px`,
        "--label-font-size": `${Math.round(fontSize * 0.6)}px`,
        "--fade-in": `${fadeIn}ms`,
        "--fade-out": `${fadeOut}ms`,
      } as React.CSSProperties}
    >
      <img
        className="join-image"
        src={profileUrl}
        alt={nickname}
        onError={(e) => {
          (e.target as HTMLImageElement).src = "https://via.placeholder.com/300";
        }}
      />

      <div className="join-text">
        {nickname.split("").map((letter, i) => (
          <span
            key={i}
            className="animated-letter"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            {letter === " " ? "\u00A0" : letter}
          </span>
        ))}
      </div>

      <div className="join-label">joined the stream!</div>
    </div>
  );
}
