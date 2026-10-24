# 🎮 PocketZot 中文汉化版（Chinese localization fork）

> **非官方第三方汉化版**。原项目：[pocketzot/pocketzot](https://github.com/pocketzot/pocketzot)
> （AGPL-3.0-or-later，版权归原作者）。本仓库保留原版权声明，并在其基础上增加
> **仅限显示层**的中文汉化。

🌐 **在线体验：<https://pocketzot-cn.pages.dev/>**

PocketZot 是一个手机竖屏用的《Dungeon Crawl Stone Soup》(DCSS) 客户端：既能连
公共 WebTiles 服务器在线玩，也能把 DCSS 引擎（WebAssembly）下载到设备上离线玩。
它是 PWA，可以“添加到主屏幕”。

## 🀄 汉化是怎么实现的

汉化完全发生在**显示边界**，按“抽取 → 编译 → 匹配 → 界面替换”的路径完成：

1. **抽取词库**：从 DCSS 中文数据（`dat/i18n`、`dat/descript`、`dat/database`）
   导出引擎消息模板、物品/怪物/神祇描述、诗句与神明/怪物台词，生成
   `src/i18n/data/zh.json` 与 `zh-descript.json`。
2. **编译匹配器**：把模板里的 `%s` / `%1$s` 编译成可匹配“已格式化游戏文本”的
   规则；客户端只看到成品句子，所以匹配时再反向填充捕获到的名字、数字、装备。
3. **显示层拦截**：在文本写入界面的位置接入翻译——战斗日志逐行、菜单标题与行、
   describe 正文与属性行（`rPois:` → 毒抗）、HUD 与设置等自有界面文案。
4. **专项规则**：物品语法（`+2 匕首（淬火）`）、动态句式（命中率、速度、毒发）、
   法术/技能菜单的中文列重排、专名与台词配对表。
5. **兜底**：任何未命中的句子按原文显示，保证界面永远可读、不出现半中半英的
   乱码式拼接。

数据与代码分层：`src/i18n/` 只负责翻译与排版，游戏解析、状态与协议保持原样；
新增界面文案时补词表即可，不需要改动游戏逻辑。

## 使用

线上版：**<https://pocketzot-cn.pages.dev/>**

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

翻译以“补丁 + 显示层挂钩”的方式叠加到上游新版本：步骤与冲突范围见
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


## 自动同步上游

仓库内置 `.github/workflows/upstream-sync.yml`：每天北京时间 11:00 拉取上游
`pocketzot/pocketzot` 最新代码，应用 `localization.patch`，构建并自动部署到
Cloudflare Pages。补丁与上游冲突时任务会失败并通知，站点保持上一版，不会部署
半成品。

## 🤝 协作说明

本项目与 **DeepSeek V4.1 Flash** 合作完成：翻译数据整理、匹配规则、界面接入与
测试由双方协作产出。

## 技术栈

TypeScript + [Vite](https://vitejs.dev)；测试用 Vitest；无后端，Cloudflare Pages
静态托管。

