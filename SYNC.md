# Keeping this fork in sync with upstream

This project is a **Chinese localization fork** of
[pocketzot](https://github.com/pocketzot/pocketzot). Upstream keeps moving; the
translation is a display-layer mount, so syncing means re-applying a patch (or
rebasing a fork branch), not merging game logic.

## What is in this folder

| Path | Role |
| --- | --- |
| `localization.patch` | every change of this fork, as a unified diff against the pristine upstream snapshot (`..\_research\pocketzot-main`) |
| `tools/make-localization-patch.mjs` | regenerates the patch (`--base <pristine snapshot>`) |
| `setup-sync.ps1` | turns this folder into a local Git repo (version control + `upstream` remote) |
| `SYNC.md` | this file |

The patch replaces whole files per changed path. Upstream edits inside those
files therefore conflict **visibly** instead of applying in the wrong place;
new files (the whole `src/i18n/` layer) apply cleanly.

## Recommended: sync by applying the patch to a fresh upstream clone

This works even though this folder was never cloned from upstream.

### One-time

```powershell
winget install --id Git.Git -e --accept-source-agreements --accept-package-agreements
# open a NEW terminal, then:
cd <工作目录>
git clone https://github.com/pocketzot/pocketzot.git pocketzot-upstream
cd pocketzot-upstream
git checkout -b zh-localization
git apply --check ..\pocketzot\localization.patch
```

If `--check` passes:

```powershell
git apply ..\pocketzot\localization.patch
npm ci
npx tsc
npx vitest run
npx vite build
```

If `--check` fails (upstream moved), apply what fits and resolve the rest:

```powershell
git apply --reject ..\pocketzot\localization.patch
# each failed file leaves a .rej; resolve it by hand using the hook table below
Get-ChildItem -Recurse -Filter *.rej | ForEach-Object { $_.FullName }
```

Conflicts are expected only in the hook files. Resolution rule: **keep
upstream's logic, re-add only the translation call**. Never move translation
into `src/game/` — parsing, state and protocol stay untouched, which is what
keeps the fork rebaseable and the tests meaningful.

Then commit and keep working in that clone:

```powershell
git add -A
git commit -m "Chinese localization on upstream <date>"
```

### Every later sync

```powershell
cd <本项目目录>-upstream
git fetch origin
git rebase origin/main          # conflicts only in the hook files
npx tsc && npx vitest run && npx vite build
powershell -ExecutionPolicy Bypass -File ..\pocketzot\download-offline.ps1
```

## Optional: local Git history for this folder

`setup-sync.ps1` initialises a repository here with one baseline commit and an
`upstream` remote. It is a version-control safety net (tag known-good states,
diff against yourself), not the sync mechanism:

```powershell
git tag -a working-$(Get-Date -Format yyyyMMdd) -m "known good"
```

Regenerate the patch after changing this folder:

```powershell
node tools/make-localization-patch.mjs --base <原始上游快照>
```

## The hook files (all that upstream can conflict with)

| File | Hook |
| --- | --- |
| `src/main.ts` | `initI18n()`, `loadDescript()` before the first view mounts |
| `src/prefs.ts` | `language` default (`zh`), `mapRenderMode` default |
| `src/views/layout-view.ts` | describe title/body: `zhDescribe()` + `translateBody()` |
| `src/views/message-log.ts` | `displayLine()` translates a log row at the display boundary |
| `src/views/menu-view.ts` | menu title/rows/footer: `tTitle`, `tItem`, `tMore` |
| `src/views/menu-columns.ts` | Chinese columns for spell/ability menus |
| `src/views/game-view.ts` | overlay titles, tile-notice text |
| `src/views/settings-view.ts` | language switch row |
| `src/views/skill-reflow.ts` | skill panel names and header |
| `src/game/tiles/tile-loader.ts` | tile-error notice text (display only) |
| `vite.config.ts` | dev proxy for `/offline` + `/gamedata/local`, watch ignore |

Everything else in `src/i18n/`, `tools/`, the data JSON, `names-zh.ts`,
`body.ts`, `SOURCE.md` and the download script is new files: they never
conflict.

## What does NOT need syncing

- `src/i18n/data/zh.json`, `zh-descript.json` are generated from **DCSS 0.34.1
  Chinese data**, independent of pocketzot's version. Refresh them only when
  the dictionary source changes.
- `names-zh.ts`, `supp-zh.ts`, `ui-zh.ts` are hand-maintained tables; new
  upstream UI strings simply stay English until added (graceful fallback).

## Release checklist

1. `npx tsc` — 0 errors
2. `npx vitest run` — all green
3. `npx vite build` — writes `dist/`
4. `download-offline.ps1` — optional, adds `/offline` + `/gamedata/local`
5. regenerate `dist/source.zip` with `git archive --format=zip HEAD -o dist\source.zip`
   (or re-run the archive step; never include `node_modules`/`dist`/`HANDOVER.md`)
6. upload `dist` (or its zip) to Cloudflare Pages; verify `/source.zip` and
   `/offline/version.json` respond.

