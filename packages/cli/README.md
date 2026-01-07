# @eulerstream/overlay-cli

CLI for building and bundling TikTok Live overlays.

## Installation

```bash
npm install -g @eulerstream/overlay-cli
```

Or use with npx:

```bash
npx @eulerstream/overlay-cli <command>
```

## Commands

### `overlay-cli manifest`

Compile a TypeScript manifest file to JSON.

```bash
overlay-cli manifest [options]
```

**Options:**
- `-i, --input <path>` - Input manifest.ts path (default: `./manifest.ts`)
- `-o, --output <path>` - Output manifest.json path (default: `./dist/manifest.json`)

**Example:**
```bash
overlay-cli manifest -i ./manifest.ts -o ./dist/manifest.json
```

### `overlay-cli bundle`

Bundle an overlay into a production-ready `bundle.zip` file.

```bash
overlay-cli bundle [options]
```

**Options:**
- `-e, --entry <path>` - Entry file path (default: `./src/index.ts`)
- `-m, --manifest <path>` - Manifest file path (default: `./manifest.ts`)
- `-o, --output <path>` - Output directory (default: `./dist`)
- `-p, --public <path>` - Public assets directory (default: `./public`)

**Example:**
```bash
overlay-cli bundle -e ./src/index.tsx -o ./dist
```

**Output:**
The command produces a `bundle.zip` containing:
- `index.js` - IIFE bundle with React baked in
- `manifest.json` - Compiled manifest
- Any files from the `public` directory

### `overlay-cli dev generate-hooks`

Internal development command to generate SDK hooks from WebcastEventName types.

```bash
overlay-cli dev generate-hooks [options]
```

**Options:**
- `-o, --output <path>` - Output directory (default: `./packages/sdk/src/hooks/generated`)

## How It Works

### Bundle Process

1. **Manifest Compilation**: Uses esbuild to compile `manifest.ts` to JSON
2. **Overlay Bundling**: Creates an IIFE bundle using esbuild with:
   - React and React DOM bundled in (self-contained)
   - JSX transform configured
   - Minification enabled
   - Source maps included
3. **Asset Copying**: Copies public assets to the output
4. **Zip Creation**: Archives everything into `bundle.zip` with maximum compression

### Expected Project Structure

```
my-overlay/
├── src/
│   └── index.tsx      # Entry point (exports defineOverlay)
├── public/            # Static assets (optional)
├── manifest.ts        # Overlay manifest configuration
└── package.json
```

## Development

### Building the CLI

```bash
pnpm build
```

### Running in Development

```bash
pnpm dev <command>
```

### Project Structure

```
cli/
├── src/
│   ├── index.ts              # CLI entry point (Commander.js)
│   └── commands/
│       ├── manifest.ts       # Manifest compilation logic
│       ├── bundle.ts         # Bundle creation logic
│       └── generate-hooks.ts # Hook generation (internal)
├── dist/                     # Compiled output
└── package.json
```

## Dependencies

- **commander** - CLI argument parsing
- **esbuild** - Fast JavaScript/TypeScript bundling
- **archiver** - ZIP file creation

## License

See root repository for license information.
