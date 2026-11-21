# Yapmod plugins by ilyeshdz

My [personal plugin catalog](https://ilyeshdz.github.io/yapmod-plugin/) is built on [Plugin Starter](https://github.com/yapmod/plugin-starter). Each published plugin has a JavaScript download and an import URL you can paste into **Plugins → Add Plugin → Plugin URL** in Yapmod.

## Saved Replies

Saved Replies 1.0 requires [Yapmod client 1.2.0](https://github.com/yapmod/client/releases/tag/v1.2.0) or later. Paste this folder URL into **Plugins → Add Plugin → Plugin URL**, then enable it:

```text
https://raw.githubusercontent.com/ilyeshdz/yapmod-plugin/plugin-dist/saved-replies/
```

Open **Saved Replies** from the message composer toolbar (or **Composer tools** on narrow layouts). Use **New reply** to save a title and message. Select a reply to insert its text into the draft, then review and send the message yourself. Edit and delete replies in the same picker or the plugin's settings.

Replies are saved in this browser using Yapmod's per-plugin storage. Insertion keeps the existing draft, inserts after any selected text, and refuses to exceed the composer's character limit. If the draft changes while the picker is open, it appends instead. If the composer disappears or the conversation URL changes, reopen the picker in the intended conversation. Nothing is sent automatically.

Client 1.2.0 does not expose a text-insertion method or persistence results. A small compatibility adapter focuses the exact SDK-selected textarea and dispatches a native input event for React. Saving uses the public storage setter and verifies the client's versioned backing record to detect swallowed quota errors. These adapters should be rechecked when the client changes those internals. Public composer insertion is tracked in [client issue #97](https://github.com/yapmod/client/issues/97).

### Validation

`pnpm build` runs typechecking and focused storage/insertion tests before building the catalog. For the React integration checks against the published client 1.2.0 bundle:

```bash
pnpm exec playwright install chromium
pnpm test:browser
```

The browser fixture exercises reply management, reload persistence, React draft updates, multiple composers, storage failures, and disposal/reinjection. It simulates Yapin's composer DOM; it is not an end-to-end test on the live Yapin service.

## Character Counter compatibility

Character Counter 1.1 uses `composer.registerStatus` and requires [Yapmod client 1.1.0](https://github.com/yapmod/client/releases/tag/v1.1.0) or later. To use version 1.0 on an older client, paste this pinned import URL into **Plugins → Add Plugin**:

```text
https://raw.githubusercontent.com/ilyeshdz/yapmod-plugin/f149a9a9705803a530263fa558e93140eb883812/character-counter/
```

## Develop a plugin

Use Node 24 and pnpm 12, then run `pnpm install` from the repository root.

1. Create `plugins/<slug>/` using lowercase letters, digits and hyphens. Keep the folder name stable after publication to preserve its import URL.
2. Add a `package.json` with string values for `name`, `author`, `description` and `version`.
3. In `index.tsx`, export a default function that returns the `onLoad` and `onUnload` hooks.
4. Run `pnpm dev <slug>` for hot reload or `pnpm build` to build the entire catalog.

The **Plugin catalog** workflow publishes the site and importable files after each successful build on `main`.
