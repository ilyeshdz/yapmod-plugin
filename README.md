# Yapmod plugins by ilyeshdz

My [personal plugin catalog](https://ilyeshdz.github.io/yapmod-plugin/) is built on [Plugin Starter](https://github.com/yapmod/plugin-starter). Each published plugin has a JavaScript download and an import URL you can paste into **Plugins → Add Plugin → Plugin URL** in Yapmod.

## Develop a plugin

Use Node 24 and pnpm 12, then run `pnpm install` from the repository root.

1. Create `plugins/<slug>/` using lowercase letters, digits and hyphens. Keep the folder name stable after publication to preserve its import URL.
2. Add a `package.json` with string values for `name`, `author`, `description` and `version`.
3. In `index.tsx`, export a default function that returns the `onLoad` and `onUnload` hooks.
4. Run `pnpm dev <slug>` for hot reload or `pnpm build` to build the entire catalog.

The **Plugin catalog** workflow publishes the site and importable files after each successful build on `main`.
