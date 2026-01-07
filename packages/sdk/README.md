# @eulerstream/overlay-sdk

SDK for building self-contained React overlays for TikTok Live streams.

## Installation

```bash
npm install @eulerstream/overlay-sdk
```

**Peer Dependencies:**
```bash
npm install react@^19.0.0 react-dom@^19.0.0
```

## Quick Start

```tsx
import { defineOverlay } from "@eulerstream/overlay-sdk";

export default defineOverlay(({ config }) => {
  return <h1 style={{ color: config.color }}>{config.title}</h1>;
});
```

## API Reference

### `defineOverlay<TConfig>(component)`

The main entry point for creating overlays. Takes a React function component and returns an overlay definition.

```tsx
import { defineOverlay } from "@eulerstream/overlay-sdk";

interface MyConfig {
  title: string;
  color: string;
  fontSize: number;
}

export default defineOverlay<MyConfig>(({ config }) => {
  return (
    <h1 style={{ color: config.color, fontSize: config.fontSize }}>
      {config.title}
    </h1>
  );
});
```

**Parameters:**
- `component: OverlayComponent<TConfig>` - A React function component that receives an `OverlayContext`

**Returns:** `OverlayDefinition<TConfig>` - A frozen overlay definition object

### `defineManifest(manifest)`

Helper function for defining type-safe overlay manifests with configuration options.

```tsx
import { defineManifest } from "@eulerstream/overlay-sdk";

export default defineManifest({
  config: {
    appearance: {
      label: "Appearance",
      description: "Visual settings",
      options: [
        {
          key: "title",
          type: "string",
          label: "Title",
          default: "My Overlay",
        },
        {
          key: "color",
          type: "color",
          label: "Text Color",
          default: "#ffffff",
        },
        {
          key: "fontSize",
          type: "number",
          label: "Font Size",
          default: 24,
          min: 12,
          max: 72,
          step: 2,
        },
      ],
    },
  },
});
```

## Hooks

### Core Hooks

#### `useWebcast()`

Access the WebSocket event emitter directly.

```tsx
import { useWebcast } from "@eulerstream/overlay-sdk";

function MyComponent() {
  const emitter = useWebcast();

  useEffect(() => {
    const handler = (event) => console.log(event);
    emitter.on("WebcastChatMessage", handler);
    return () => emitter.off("WebcastChatMessage", handler);
  }, [emitter]);
}
```

#### `useWebcastEvent(eventName, callback)`

Subscribe to a specific TikTok Live event.

```tsx
import { useWebcastEvent } from "@eulerstream/overlay-sdk";

function MyComponent() {
  useWebcastEvent("WebcastChatMessage", (event) => {
    console.log(`${event.user.nickname}: ${event.comment}`);
  });
}
```

### Generated Event Hooks

Pre-built hooks for all TikTok Live event types:

| Hook | Event | Description |
|------|-------|-------------|
| `useWebcastChatMessage` | Chat | Chat messages from viewers |
| `useWebcastGiftMessage` | Gifts | Gift sends and combos |
| `useWebcastLikeMessage` | Likes | Like button presses |
| `useWebcastMemberMessage` | Joins | Viewer join notifications |
| `useWebcastSocialMessage` | Social | Shares, follows, etc. |
| `useWebcastEmoteChatMessage` | Emotes | Emote-only messages |
| `useWebcastSubNotifyMessage` | Subs | Subscription notifications |
| `useWebcastLinkMicBattle` | Battles | Battle start/updates |
| `useWebcastLinkMicArmies` | Armies | Battle army updates |
| `useWebcastQuestionNewMessage` | Q&A | Question submissions |
| `useWebcastLiveIntroMessage` | Intro | Stream intro display |
| `useWebcastHourlyRankMessage` | Rankings | Hourly rank updates |
| `useWebcastEnvelopeMessage` | Envelopes | Red envelope events |
| `useWebcastBarrageMessage` | Barrage | Screen effects |
| `useWebcastRoomMessage` | Room | Room status updates |
| `useWebcastCaptionMessage` | Captions | Live captions |
| `useWebcastControlMessage` | Control | Stream control events |
| `useWebcastGoalUpdateMessage` | Goals | Goal progress updates |
| `useWebcastPollMessage` | Polls | Poll events |
| `useWebcastRankUpdateMessage` | Rank | Rank change events |
| `useWebcastRankTextMessage` | Rank Text | Rank text displays |
| `useWebcastRoomPinMessage` | Pins | Pinned message events |
| `useWebcastOecLiveShoppingMessage` | Shopping | Live shopping events |
| `useRoomVerifyMessage` | Verify | Room verification |

**Example:**

```tsx
import {
  useWebcastChatMessage,
  useWebcastGiftMessage
} from "@eulerstream/overlay-sdk";

function ChatOverlay() {
  const [messages, setMessages] = useState([]);

  useWebcastChatMessage((event) => {
    setMessages(prev => [...prev.slice(-99), {
      id: event.msgId,
      user: event.user.nickname,
      text: event.comment,
    }]);
  });

  useWebcastGiftMessage((event) => {
    console.log(`${event.user.nickname} sent ${event.gift.name}!`);
  });

  return (
    <ul>
      {messages.map(msg => (
        <li key={msg.id}>{msg.user}: {msg.text}</li>
      ))}
    </ul>
  );
}
```

## Types

### `OverlayContext<TConfig>`

Context provided to overlay components.

```typescript
interface OverlayContext<TConfig> {
  readonly config: TConfig;
}
```

### `OverlayComponent<TConfig>`

Function component signature for overlays.

```typescript
type OverlayComponent<TConfig> = (context: OverlayContext<TConfig>) => ReactNode;
```

### `OverlayManifest`

Manifest structure for overlay configuration.

```typescript
interface OverlayManifest {
  config?: Record<string, ConfigCategory>;
}
```

### `ConfigCategory`

Category grouping for configuration options.

```typescript
interface ConfigCategory {
  label: string;
  description?: string;
  options: ConfigOption[];
}
```

### `ConfigOption`

Configuration option types:

```typescript
// String option
interface StringConfigOption {
  key: string;
  type: "string";
  label: string;
  description?: string;
  default?: string;
  placeholder?: string;
  maxLength?: number;
}

// Number option
interface NumberConfigOption {
  key: string;
  type: "number";
  label: string;
  description?: string;
  default?: number;
  min?: number;
  max?: number;
  step?: number;
}

// Color option
interface ColorConfigOption {
  key: string;
  type: "color";
  label: string;
  description?: string;
  default?: string;
}
```

## Architecture

Overlays built with this SDK are **self-contained IIFE bundles** with React baked in. This means:

- No dependency sharing with the host application
- Overlays are loaded via script injection
- The host communicates via `window.Overlay.mount(container, props)`
- Configuration is passed at mount time and can be updated without remounting

## Development

### Building

```bash
pnpm build
```

### Watch Mode

```bash
pnpm dev
```

### Project Structure

```
sdk/
├── src/
│   ├── index.ts              # Main exports
│   ├── defineOverlay.ts      # defineOverlay implementation
│   ├── types/
│   │   ├── index.ts          # Type re-exports
│   │   ├── overlay.ts        # Overlay types
│   │   └── manifest.ts       # Manifest types
│   ├── runtime/
│   │   ├── index.ts          # Runtime exports
│   │   ├── createMount.tsx   # Mount function factory
│   │   ├── contract.ts       # Runtime contract types
│   │   ├── InternalEventEmitter.ts
│   │   └── InternalWebcastContext.tsx
│   └── hooks/
│       ├── index.ts          # Hook exports
│       ├── useWebcast.ts     # Core emitter hook
│       ├── useWebcastEvent.ts # Generic event hook
│       └── generated/        # Auto-generated event hooks
├── dist/                     # Compiled output
└── package.json
```

## License

MIT
