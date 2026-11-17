# Yapmod Plugin Starter

A starter template for building [Yapmod](https://github.com/yapmod) plugins with TypeScript and SolidJS.

## Quick Start

```bash
# Install dependencies
pnpm install

# Build the plugin
pnpm build

# Or develop with hot reload
pnpm dev
```

## Project Structure

```
├── src/
│   └── index.tsx     # Your plugin entry point
├── dist/              # Built output (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## Writing Your Plugin

The entry point (`src/index.tsx`) exports a **default function** that returns an object with lifecycle hooks. The `yapmod` global API is available inside your plugin:

```tsx
import { createSignal } from 'solid-js';

export default function () {
  return {
    onLoad() {
      yapmod.log('Plugin started!');

      yapmod.settings.registerSection({
        id: 'general',
        label: 'General',
        icon: 'settings',
        render: () => {
          const [greeting, setGreeting] = createSignal('Hello, world!');

          return (
            <yapmod.ui.SettingsPage title="My Plugin" description="Example plugin settings">
              <yapmod.ui.Section label="Appearance">
                <yapmod.ui.SettingRow label="Greeting" hint="The text shown when the plugin starts">
                  <yapmod.ui.Input value={greeting()} onChange={(v) => setGreeting(v)} />
                </yapmod.ui.SettingRow>
              </yapmod.ui.Section>
            </yapmod.ui.SettingsPage>
          );
        },
      });
    },

    onUnload() {
      yapmod.log('Plugin stopped!');
    },
  };
}
```

The `yapmod` object provides:

- **`yapmod.log()`** — Log messages with a plugin prefix
- **`yapmod.storage`** — Reactive per-plugin storage backed by `localStorage`
- **`yapmod.ui`** — SolidJS UI components (`SettingsPage`, `Section`, `SettingRow`, `Input`, `Button`, `Select`, etc.)
- **`yapmod.settings`** — Register settings sections
- **`yapmod.observe()`** — Watch for DOM elements
- **`yapmod.solid`** — Access to the shared SolidJS instance

Full API documentation is available at [yapmod.dev/docs](https://yapmod.dev/docs).

## Building

```bash
pnpm build
```

This produces a single `dist/index.js` file that you can upload to Yapmod.

## Developing

```bash
pnpm dev
```

Watches for file changes and rebuilds automatically.

## Dependencies

- **@yapmod/builder** — Bundles your TypeScript + SolidJS code into the plugin format
- **@yapmod/types** — TypeScript definitions for the entire plugin API
- **solid-js** — Reactive UI library used by Yapmod plugins
