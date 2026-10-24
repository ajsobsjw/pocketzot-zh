# PocketZot 中文汉化版（Chinese localization fork）

> **非官方第三方汉化版**。原项目：[pocketzot/pocketzot](https://github.com/pocketzot/pocketzot)
> （AGPL-3.0-or-later，版权归原作者）。本仓库保留原版权声明，并在其基础上增加
> **仅限显示层**的中文汉化。

PocketZot 是一个手机竖屏用的《Dungeon Crawl Stone Soup》(DCSS) 客户端：既能连
公共 WebTiles 服务器在线玩，也能把 DCSS 引擎（WebAssembly）下载到设备上离线玩。
它是 PWA，可以“添加到主屏幕”。

本汉化版做了什么：

- 战斗日志、提示、弹窗标题、菜单（含法术/技能菜单的中文列）逐行翻译；
- 物品、怪物、神祇、法术、地形、能力的名称与描述；
- 描述页正文、属性行（`rPois:` → 毒抗）、诗句、神谕/怪物台词；
- 应用自身界面（设置、按钮、提示、新手引导）；
- **不修改** `src/game/` 的解析、状态与网络协议——所以能持续跟上游 rebase。

未翻译的内容（有意保留英文）：神器专名、独特怪物称号、诗句署名、玩家名、储藏
搜索前缀。拿不准的句子宁可保留英文，也不乱翻。

## 使用

线上版：`https://<你的站点>.pages.dev`（部署后填写）

自行构建：

```bash
npm ci
npx tsc
npx vitest run
npx vite build      # 产物在 dist/
```

离线游玩还需要引擎与图块包（不属于源码仓库）：

```powershell
powershell -ExecutionPolicy Bypass -File .\download-offline.ps1
```

## 参与翻译

发现没翻译的句子，直接提 Issue（使用「翻译问题」模板）即可。想自己改词条请先读
[CONTRIBUTING.md](CONTRIBUTING.md)，主要文件：

| 文件 | 内容 |
| --- | --- |
| `src/i18n/supp-zh.ts` | 常用句子、模板（`%s`） |
| `src/i18n/names-zh.ts` | 怪物/物品/地形/能力名 |
| `src/i18n/ui-zh.ts` | 应用界面文案 |
| `src/i18n/titles.ts` | 带数字/状态的动态句子 |

## 与上游同步

翻译是“挂载层”，可以直接叠到上游新版本上。步骤与冲突范围见
[SYNC.md](SYNC.md)；改动汇总可用
`node tools/make-localization-patch.mjs --base <原始快照>` 重新生成。

## 许可与来源

- 本仓库代码：[AGPL-3.0-or-later](LICENSE)。原项目版权：
  Copyright (C) 2026 the PocketZot developer。
- 上游游戏：[crawl/crawl](https://github.com/crawl/crawl)（GPL-2.0-or-later）。
- 中文词库/描述/台词数据来自 DCSS 中文版
  [Drafffffff/DCSS-zh](https://github.com/Drafffffff/DCSS-zh)（基于 DCSS 0.34.1，
  GPL-2.0-or-later），生成文件见 `src/i18n/data/`。
- 本修改版的完整对应源码：部署站点上的 `/source.zip`，构建说明见
  [SOURCE.md](SOURCE.md)，版权与 DCSS 关系见 [ATTRIBUTION.md](ATTRIBUTION.md)。

本项目是非官方汉化，与 PocketZot 原作者、DCSS 开发团队均无隶属或背书关系。
问题请在本仓库提 Issue，不要打扰原作者。

## 技术栈

TypeScript + [Vite](https://vitejs.dev)；测试用 Vitest；无后端，Cloudflare Pages
静态托管。
