import type { WebcastEventEmitter } from "@eulerstream/euler-websocket-sdk";
import type { OverlayHandle, OverlayMountFunction } from "@eulerstream/overlay-sdk";

interface OverlayGlobal {
  mount: OverlayMountFunction;
  manifest?: Record<string, unknown>;
}

export interface LoadedOverlay {
  handle: OverlayHandle;
  manifest?: Record<string, unknown>;
}

function getOverlayGlobal(): OverlayGlobal | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).Overlay as OverlayGlobal | undefined;
}

function deleteOverlayGlobal(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).Overlay;
}

/**
 * Load the overlay script (does not mount).
 */
export async function loadOverlayScript(bundleUrl: string): Promise<void> {
  // Clear any previous Overlay global
  deleteOverlayGlobal();

  // Load the script
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = bundleUrl.endsWith(".js") ? bundleUrl : `${bundleUrl}/index.js`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load overlay: ${bundleUrl}`));
    document.head.appendChild(script);
  });

  // Verify overlay loaded
  const overlay = getOverlayGlobal();
  if (!overlay?.mount) {
    throw new Error("Overlay did not expose mount function");
  }
}

/**
 * Mount the overlay to a container (script must be loaded first).
 */
export function mountOverlay(
  container: HTMLElement,
  emitter: WebcastEventEmitter,
  config: Record<string, unknown>
): LoadedOverlay {
  const overlay = getOverlayGlobal();
  if (!overlay?.mount) {
    throw new Error("Overlay not loaded");
  }

  // Create event subscription bridge
  const subscribeToEvents = (
    callback: (eventName: string, data: unknown) => void
  ): (() => void) => {
    const eventNames = [
      "WebcastChatMessage",
      "WebcastGiftMessage",
      "WebcastLikeMessage",
      "WebcastMemberMessage",
      "WebcastSocialMessage",
      "WebcastRoomUserSeqMessage",
      "WebcastEmoteChatMessage",
      "WebcastLinkMicBattle",
      "WebcastLinkMicArmies",
      "WebcastQuestionNewMessage",
      "WebcastLiveIntroMessage",
      "WebcastHourlyRankMessage",
      "WebcastEnvelopeMessage",
      "WebcastSubNotifyMessage",
      "WebcastBarrageMessage",
      "WebcastRoomMessage",
      "WebcastCaptionMessage",
      "WebcastControlMessage",
      "WebcastGoalUpdateMessage",
      "WebcastImDeleteMessage",
      "WebcastInRoomBannerMessage",
      "WebcastRankUpdateMessage",
      "WebcastPollMessage",
      "WebcastRankTextMessage",
      "WebcastLinkMicBattlePunishFinish",
      "WebcastLinkmicBattleTaskMessage",
      "WebcastLinkMicFanTicketMethod",
      "WebcastLinkMicMethod",
      "WebcastUnauthorizedMemberMessage",
      "WebcastMsgDetectMessage",
      "WebcastOecLiveShoppingMessage",
      "WebcastRoomPinMessage",
      "WebcastLinkMessage",
      "WebcastLinkLayerMessage",
      "roomVerifyMessage",
      "roomInfo",
      "workerInfo",
      "SyntheticJoinMessage",
      "SyntheticLeaveMessage",
      "tiktok.connect",
      "tiktok.disconnect",
    ] as const;

    const handlers = new Map<string, (data: unknown) => void>();

    for (const eventName of eventNames) {
      const handler = (data: unknown) => callback(eventName, data);
      handlers.set(eventName, handler);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      emitter.on(eventName as any, handler as any);
    }

    return () => {
      for (const [eventName, handler] of handlers) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        emitter.off(eventName as any, handler as any);
      }
    };
  };

  // Mount the overlay
  const handle = overlay.mount(container, {
    config,
    subscribeToEvents,
  });

  return {
    handle,
    manifest: overlay.manifest,
  };
}
