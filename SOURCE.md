# Source code of this build

This site runs a **third-party Chinese localization fork** of
[PocketZot](https://github.com/pocketzot/pocketzot), the unofficial mobile
WebTiles client for Dungeon Crawl Stone Soup.

- Original work: PocketZot, Copyright (C) 2026 the PocketZot developer,
  licensed under AGPL-3.0-or-later (see `LICENSE`).
- This fork: an unaffiliated modification (2026), also under
  AGPL-3.0-or-later. It keeps the original copyright and attribution.
- Complete corresponding source of this build: the archive that contains this
  file (`/source.zip` on the deployed site).

## What the fork changes

Everything is display-layer only — the game's parsing, state model, and
network protocol are untouched:

- `src/i18n/` — the translation layer: dictionary compiler, item grammar,
  title/panel rules, describe-body and speech pairing, DOM/UI translation.
- `src/i18n/data/zh.json`, `src/i18n/data/zh-descript.json` — generated
  dictionary and description/speech pairs (from the community DCSS 0.34.1
  Chinese data files).
- `src/i18n/names-zh.ts`, `supp-zh.ts`, `ui-zh.ts` — curated names, phrases and
  own-UI strings the engine dictionary does not carry.
- `src/i18n/describe.ts`, `body.ts`, `titles.ts`, `items.ts`, `translate.ts` —
  matching/rendering rules.
- `src/views/menu-columns.ts` — Chinese column layout for spell/ability menus.
- `tools/build-zh-dict.mjs`, `tools/build-zh-descript.mjs` — regenerate the
  data files from a localized DCSS install (`--src <install>/dat`).
- `download-offline.ps1` — fetch the WebAssembly engine and tile pack from the
  official deployment into `dist/` for static hosting (optional).

## Build

Requires Node.js 20+ (the project was built with Node 24).

```bash
npm ci

# Type check, test, bundle
npx tsc
npx vitest run
npx vite build
```

`vite build` writes `dist/`. The upstream `npm run build` script referenced a
`scripts/check-html-links.mjs` that is not part of this source snapshot, so the
script here runs the three steps above directly; if you add your own link
checker, restore it in `package.json`.

### Offline engine (optional)

`dist/` alone serves online play. Offline play needs the engine artifacts
(`/offline/*`) and tile pack (`/gamedata/local/*`), which are deploy artifacts
and not included in the source archive. Either copy them from the official
deployment, or on Windows run:

```powershell
powershell -ExecutionPolicy Bypass -File .\download-offline.ps1
```

after building, then upload `dist/`.

## Data provenance and licensing

- Chinese translations in `src/i18n/data/zh.json` and `zh-descript.json` are
  generated from the community Chinese build
  [Drafffffff/DCSS-zh](https://github.com/Drafffffff/DCSS-zh) (based on DCSS
  0.34.1), whose game data and catalogs are GPL-2.0-or-later.
- Upstream game: [crawl/crawl](https://github.com/crawl/crawl),
  GPL-2.0-or-later, Copyright 1997–2025 Linley Henzell, the dev team and
  contributors.
- Only display strings are extracted (messages, descriptions, speech, quotes,
  tutorial text). Saves, Lua, input parsing and game logic keep their English
  identifiers and upstream code.
- This repository's code remains AGPL-3.0-or-later; see `LICENSE` and
  `ATTRIBUTION.md` for the original copyright and the DCSS relationship.
