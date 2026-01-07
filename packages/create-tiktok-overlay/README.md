# create-tiktok-overlay

Create TikTok LIVE overlay widgets with one command.

## Usage

```bash
# Using npm
npm create tiktok-overlay

# Using npx
npx create-tiktok-overlay

# Using pnpm
pnpm create tiktok-overlay

# Using yarn
yarn create tiktok-overlay

# Using bun
bun create tiktok-overlay
```

## Interactive Setup

The CLI will guide you through the setup process:

```
┌  create-tiktok-overlay
│
◆  What is your overlay called?
│  my-chat-overlay
│
◆  Describe your overlay (optional)
│  A custom chat overlay for TikTok LIVE
│
◆  Install dependencies?
│  Yes
│
◆  Which package manager?
│  ● pnpm (recommended)
│  ○ npm
│  ○ yarn
│  ○ bun
│
◇  Template downloaded
◇  Project configured
◇  Dependencies installed
│
├  Next steps
│  cd my-chat-overlay
│  pnpm dev
│
└  Happy streaming!
```

## What You Get

After running the command, you'll have a fully configured overlay project:

```
my-chat-overlay/
├── src/
│   └── index.tsx      # Your overlay component
├── public/            # Static assets
├── manifest.ts        # Configuration manifest
├── package.json       # Dependencies and scripts
├── tsconfig.json      # TypeScript configuration
└── vite.config.ts     # Build configuration
```

## Project Scripts

```bash
# Start development server with hot reload
pnpm dev

# Build production bundle
pnpm build

# Preview production build
pnpm preview
```

## Template Features

The generated project includes:

- **React 19** - Latest React with hooks and concurrent features
- **TypeScript** - Full type safety
- **Vite** - Fast development server and optimized builds
- **@eulerstream/overlay-sdk** - TikTok Live event hooks and types
- **@eulerstream/overlay-cli** - CLI for building production bundles
- **Tailwind CSS** - Utility-first styling (optional)

## Example Overlay

The template includes a starter overlay:

```tsx
import { defineOverlay, useWebcastChatMessage } from "@eulerstream/overlay-sdk";
import { useState } from "react";

interface Config {
  maxMessages: number;
  textColor: string;
}

export default defineOverlay<Config>(({ config }) => {
  const [messages, setMessages] = useState<Array<{
    id: string;
    user: string;
    text: string;
  }>>([]);

  useWebcastChatMessage((event) => {
    setMessages(prev => [
      ...prev.slice(-(config.maxMessages - 1)),
      {
        id: event.msgId,
        user: event.user.nickname,
        text: event.comment,
      }
    ]);
  });

  return (
    <div className="chat-overlay">
      {messages.map(msg => (
        <div key={msg.id} style={{ color: config.textColor }}>
          <strong>{msg.user}:</strong> {msg.text}
        </div>
      ))}
    </div>
  );
});
```

## Configuration Manifest

Define configurable options in `manifest.ts`:

```ts
import { defineManifest } from "@eulerstream/overlay-sdk";

export default defineManifest({
  config: {
    display: {
      label: "Display Settings",
      options: [
        {
          key: "maxMessages",
          type: "number",
          label: "Max Messages",
          default: 10,
          min: 1,
          max: 50,
        },
        {
          key: "textColor",
          type: "color",
          label: "Text Color",
          default: "#ffffff",
        },
      ],
    },
  },
});
```

## Building for Production

```bash
# Build the overlay bundle
pnpm build
```

This produces a `dist/bundle.zip` containing:
- `index.js` - Self-contained IIFE bundle
- `manifest.json` - Configuration schema
- Any files from `public/`

## Development

### Building the CLI

```bash
pnpm build
```

### Running in Development

```bash
pnpm dev
```

### Project Structure

```
create-tiktok-overlay/
├── src/
│   ├── index.ts       # CLI implementation
│   └── tiged.d.ts     # Type definitions
├── dist/              # Compiled output
└── package.json
```

### Template Repository

The template is pulled from:
```
EulerStream/TikTok-LIVE-Overlays/examples/create-tiktok-overlay
```

## Requirements

- Node.js 18+
- Internet connection (for downloading template)

## License

MIT
