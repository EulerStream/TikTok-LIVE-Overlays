# display

Web application that hosts and displays TikTok LIVE overlays. This is the runtime environment that loads overlay bundles and connects them to live stream events.

> **Note:** This is a private workspace package and is not published to npm.

## Overview

The display app is responsible for:

1. **Authentication** - Fetching JWT tokens for WebSocket connections
2. **Overlay Loading** - Dynamically loading overlay bundles via script injection
3. **Event Relay** - Connecting TikTok LIVE WebSocket events to overlays
4. **Configuration** - Managing user settings and overlay configuration
5. **UI** - Providing settings interface and connection status

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Display App                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   App.tsx    │  │OverlayLoader │  │ useWebcast       │  │
│  │              │  │              │  │ Connection       │  │
│  │ - Auth       │  │ - Script     │  │                  │  │
│  │ - Config     │  │   loading    │  │ - WebSocket      │  │
│  │ - Routing    │  │ - Mounting   │  │ - Event relay    │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    window.Overlay.mount()                    │
├─────────────────────────────────────────────────────────────┤
│                   Overlay Bundle (IIFE)                      │
│              Self-contained React application                │
└─────────────────────────────────────────────────────────────┘
```

## Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `App.tsx` | Main overlay display |
| `/config` | `ConfigPage.tsx` | Overlay settings |

## Overlay Identification

The app identifies which overlay to load using:

1. **Subdomain** (primary) - e.g., `my-overlay.overlays.eulerstream.com`
2. **Query parameter** (fallback) - e.g., `?overlayId=my-overlay`

## API Integration

### Configuration Endpoint

```
GET /api/overlays/{overlayId}/config?token={token}
```

**Response:**
```json
{
  "bundleBasePath": "https://cdn.example.com/overlays/abc123",
  "icon": "https://cdn.example.com/icons/abc123/icon.png",
  "title": "My Overlay",
  "jwt": {
    "key": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "uniqueId": "streamer_username"
  }
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Base URL for API calls | `https://www.eulerstream.com` |

### Testing Override

Add `?t=1` to the URL to override the API base URL to `http://localhost:3000` for local testing of production builds.

## Development

### Prerequisites

- Node.js 18+
- pnpm

### Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Scripts

```bash
# Start dev server with hot reload
pnpm dev

# Build for production
pnpm build

# Lint code
pnpm lint

# Preview production build
pnpm preview
```

### Environment Files

- `.env.development` - Development environment
- `.env.production` - Production environment

## Project Structure

```
display/
├── src/
│   ├── App.tsx                    # Main application component
│   ├── main.tsx                   # Entry point with router setup
│   ├── index.css                  # Global styles (Tailwind)
│   ├── vite-env.d.ts              # Vite type definitions
│   ├── components/
│   │   ├── OverlayLoader.tsx      # Overlay loading and mounting
│   │   ├── ConnectionStatus.tsx   # WebSocket status display
│   │   └── ui/                    # Radix UI components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       └── slider.tsx
│   ├── pages/
│   │   └── ConfigPage.tsx         # Settings page
│   ├── hooks/
│   │   └── useWebcastConnection.ts # WebSocket management
│   └── lib/
│       ├── overlay-loader.ts      # Script injection logic
│       ├── manifest.ts            # Manifest parsing
│       ├── config-storage.ts      # localStorage config
│       └── utils.ts               # Utilities
├── public/                        # Static assets
├── index.html                     # HTML entry point
├── vite.config.ts                 # Vite configuration
├── tsconfig.json                  # TypeScript config
└── package.json
```

## Key Components

### `App.tsx`

Main orchestrator that handles:
- Fetching overlay configuration and JWT from API
- Managing connection state
- Setting favicon and page title
- Rendering loading/error states

### `OverlayLoader.tsx`

Handles overlay bundle lifecycle:
- Script injection via `<script>` tag
- Mounting via `window.Overlay.mount()`
- Config updates without remounting
- Cleanup on unmount

### `useWebcastConnection.ts`

WebSocket connection hook providing:
- Connection state management
- Auto-reconnect with exponential backoff
- Event emitter for overlay consumption

### `overlay-loader.ts`

Low-level overlay loading utilities:
- `loadOverlayScript()` - Inject script and wait for load
- `mountOverlay()` - Mount to container with event bridge

## Supported Events

The display app relays 35+ TikTok LIVE event types to overlays:

- Chat messages, gifts, likes
- Member joins, social events
- Battles, armies, rankings
- Subscriptions, polls, goals
- Shopping, captions, controls
- And more...

## Technologies

- **React 19** - UI framework
- **React Router 7** - Client-side routing
- **Vite** - Build tool and dev server
- **Tailwind CSS 4** - Styling
- **Radix UI** - Accessible UI primitives
- **TypeScript** - Type safety

## Dependencies

### Runtime
- `@eulerstream/overlay-sdk` - SDK types and contracts
- `@eulerstream/euler-websocket-sdk` - WebSocket client
- `react`, `react-dom` - UI framework
- `react-router-dom` - Routing
- `@radix-ui/*` - UI components
- `lucide-react` - Icons
- `class-variance-authority`, `clsx`, `tailwind-merge` - Styling utilities

### Development
- `vite`, `@vitejs/plugin-react` - Build tooling
- `typescript`, `eslint` - Code quality
- `tailwindcss` - CSS framework

## License

Private - Not for redistribution.
