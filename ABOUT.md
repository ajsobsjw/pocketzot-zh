# About PocketZot

PocketZot is an unofficial [DCSS](https://crawl.develz.org) app designed for iOS and Android phones in portrait mode. Play online on public [WebTiles](https://crawl.develz.org/wordpress/howto) servers, or offline with DCSS running entirely on your device.

## Getting started

DCSS has no app on the App Store, but you don't need one: install PocketZot like an app with "Add to Home Screen". Then log in to a WebTiles server and play, or tap "Play offline". iPads and other tablets work too.

## Features

- Custom ASCII-first design that fits the full standard console map onto a phone in portrait mode, with a font still large enough to read
- Offline play support
- Tiles support
- Chat support
- Customizable controls
- Map touch gestures
- Log in with multiple WebTiles server accounts and switch between them
- Inline tap targets in many menus and descriptions
- Context-aware control sets for common situations
- Spectator mode with an expanded map view
- Floating, collapsible monster list; tap to inspect monsters
- 8.6 trillion logos
- Installs to your home screen as a PWA

## Controls

The controls are organized into three tabs: **@**, **>**, and **?**. The mental model is:

- **@** *"micro"* — moment-to-moment actions, including during battle
- **>** *"macro"* — actions often taken outside of battle, or after clearing a floor
- **?** *"info"* — commands to get information about your character or game

Obligatory virtual keyboard also available.

## Gestures

- Tap floating monster list to inspect monsters
- Swipe floating monster list to the other side, or drag it to peek behind
- Tap place name in HUD (e.g. @D:1) to toggle minimap
- Long press on map cell to see what's there
- Long press a spell, then drag to rearrange the spell rail
- Tap or drag on map while targeting or examining (`x`) to move the cursor
- Drag map to open level map (`X`)
- Double tap on map to toggle zoom level
- Two-finger long press on map to toggle ASCII/tiles
- Hold a d-pad direction to shift-move
- Double tap Shift to lock it

### Level map (`X`)

- Drag to pan
- Tap or drag the minimap to pan
- Tap to place the cursor

## Offline play

Tap the "Play offline" card on the login screen to run DCSS directly on your device with no server, account, or connection required. The first launch installs the engine and tile data as a one-time download. After that, games can start and play even in airplane mode.

Offline characters get named save slots, a past-games list with scores and morgues, an editable options (RC) file, and a Backup feature that exports everything to a single file you can keep or move to another device. Saves live in your browser's storage, which the OS can evict under storage pressure. If a character matters to you, export a backup occasionally.

## Version support

Current stable and trunk DCSS are supported. Versions back to 0.24 generally work; older versions and forks may or may not. In particular, starting a new character on versions before 0.24 doesn't work. Offline play currently ships 0.35-a0.

## Security and privacy

PocketZot has no accounts of its own. Your browser connects directly to your chosen DCSS server over an encrypted WebSocket, just like the desktop WebTiles client. Credentials go only in the login message and are never stored. Saved logins keep the server's session cookie, not your password. The site records anonymous usage counts.

## License, attribution and source

PocketZot is Copyright (C) 2026 the PocketZot developer and licensed under
[AGPL-3.0-or-later](LICENSE). The original project lives at
<https://github.com/pocketzot/pocketzot>.

This deployment is a **third-party Chinese localization fork** (unofficial,
unaffiliated with the original developer). It keeps the original copyright and
licence; the modifications are confined to the display layer — a Chinese
translation layer for UI strings, items, monsters, gods, spells, database prose
and speech — and do not change the game's parsing or network protocol.

In accordance with AGPL-3.0, the **complete corresponding source of this
modified version** is available here:
**[下载本项目完整修改源码 (Source Code)](/source.zip)**.
The archive contains everything needed to rebuild this deployment; see
`SOURCE.md` inside it.

本站点是 PocketZot 的**第三方中文汉化版**，与原作者无关，保留原作者版权声明并按
AGPL-3.0-or-later 分发。修改仅限显示层的汉化，不改变游戏解析与网络协议。按
AGPL-3.0 的要求，本修改版的完整对应源码可在上方 `/source.zip` 下载。

## Feedback

请在本仓库的 Issues 里反馈问题（这是第三方汉化版，请不要打扰原作者）。

## Thanks

My thanks to the following people, whose feedback, feature requests, and bug reports have helped improve the app. In chronological order:

- Tanach
- yfiyjf
- Tremis
- AscendedTourist
- AllRuneOrDeath
- Ralph Hayward
- MudToeberg
- evrim.zone
- invasionofsmallcubes
- aeshna-cyanea
- Caeous

And thanks to everyone else who has sent a kind word. I always appreciate your messages.
