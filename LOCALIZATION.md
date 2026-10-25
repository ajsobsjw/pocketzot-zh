# 中文化说明（display-only localization）

这份改动只作用于**渲染层**：游戏消息、菜单、HUD、PocketZot 自己的界面在写到屏幕前被翻译成中文。
`src/game/` 里的英文解析（提示按钮切分、法术列表定宽列、技能表网格、状态/神明判断、怪物名过滤、
符文词表等）**一行都没有改**，所以触控、快捷键、排序、存档行为与英文版完全一致。

## 结构

| 文件 | 作用 |
|---|---|
| `src/i18n/data/zh.json` | 由 DCSS 0.34.1 汉化版的 `dat/i18n/zh/source.txt` 生成的 13,984 条对照表（懒加载 chunk，brotli 约 320 KB）|
| `src/i18n/supp-zh.ts` | 词库缺口的手工补充：菜单分类词、提示问句、常见物品名词，以及 0.34.1 词库没有的 0.35 战斗/状态句 |
| `src/i18n/ui-zh.ts` | PocketZot 自己的界面文案（登录/大厅/设置/离线大厅/记录/操作名）|
| `src/i18n/translate.ts` | 匹配器：整句精确匹配 → 去掉颜色标记/热键前缀 → 带占位符的模板 → `label: 12` 规则；**匹配不成功一律返回原文** |
| `src/i18n/items.ts` | 物品名语法：`+1 dagger of venom` → `淬毒的+1匕首`、`2 black potions` → `黑色药水×2` |
| `src/i18n/titles.ts` | 动态标题：`Gear: 1/52 gear slots`、`Casting: …` 等 |
| `src/i18n/index.ts` | `t()` / `tItem()` / `tTitle()` / `tLabel()`、语言状态与懒加载 |
| `src/i18n/describe.ts` + `data/zh-descript.json` | 详情面板的散文替换：按标题里的英文名查 `dat/descript/zh`，只换散文段，数值行保留；生物面板另用 139 条 `monstatus` 标签正文 |
| `src/i18n/monster.ts` | 生物面板专用：命中/注意/速度整句、攻击表逐格+列对齐、状态标签+正文、引言 |
| `src/i18n/dom.ts` | 渲染后文本节点与 placeholder/aria-label/title 的自动翻译；跳过地图网格与 CRT 定宽屏；切回英文会还原原文 |
| `src/views/tile-error-notice.ts` | 图块图集加载失败时弹一次可见提示（否则只会静默退回 ASCII，无法区分是故障还是 ASCII 模式）|

## 翻译能力（按截图反馈迭代过）

- **句子里的名字会二次翻译**：模板命中后，把 `%s` 的内容去掉 `a/an/the` 再查名字表/物品语法
  → `You see a +0 sling.` = 你看到了投石索。 · `You hit the kobold.` = 你击中了狗头人。
- **HUD 标签规则放宽**：`Health: 10/10`、`Cast: 召唤小型哺乳动物`、`Place: Dungeon:1` 都能翻
  （标签词条 + “值”二次处理，`Dungeon:1` → `地牢:1`）。
- **调试开关**：URL 加 `?no-i18n=1` 完全按英文渲染，用于区分“汉化引起的问题”和“本来就有的问题”。
- 地图模式默认改为 **Tiles**；设备没有 Canvas 时自动退回 ASCII（不会白屏）。
- **开发环境的离线模式**：`vite.config.ts` 把 `/offline/*` 与 `/gamedata/local/*` 代理到
  官方部署，因此本地也能走完“下载引擎 → 离线开局”，并且**离线自带图块包**。
- **动态战斗句**：模板编译不再拒绝“以 %s 开头”的条目（`%s bites you.` 这类曾被误判为
  相邻占位符），并补了咬击/重伤/靠近/进入视野/浅水等常用句式与 `pair of gloves`、
  `of infusion` 等物品片段。
- **标点归一化只用于匹配**：引擎会发弯引号 `can’t`、`“…”`、短破折号 `–`、省略号 `…` 和
  `&apos;`，而词库键是 ASCII。匹配器在候选串上做等价归一化（输出仍取词库/原文），并把模板
  里的这些字符编译成兼容正则，因此 `%s` 捕获到的名字不会被改写。
- **0.35 新增句**：词库来自 0.34.1，0.35 引擎新增/改写的战斗、施法、状态句从 0.35 wasm
  字符串审计后补进 `supp-zh.ts`（约 200 条）。同一套审计也用于发现 `The` 冠词被删、
  `, but do no damage` 逗号、`completely miss` 等句式差异。

## 未命中清单（提高覆盖率的主要手段）

开发环境左下角有一个「未命中 N」小按钮：它统计所有“有英文字符但没翻出来”的句子，
点一下会下载 `i18n-misses.txt`（TSV：次数<TAB>原文，按频次排序）。把这些高频句补进
`src/i18n/supp-zh.ts` 即可，不需要猜。

## 接入点（都只是“显示副本”）

- `src/views/message-log.ts`：日志整行（保留行首颜色标签；切语言时按原文重渲染）
- `src/views/layout-view.ts`：describe 覆盖层（切语言时按原始 ui-push 重绘，保留滚动位置）
- `src/views/menu-view.ts`：菜单标题、行文本；法术/技能菜单由 `menu-columns.ts` 重排为中文列
- `src/views/game-view.ts`：所有 overlay 标题
- `src/views/settings-view.ts`：新增「语言 / Language」分段开关
- `src/i18n/dom.ts`：其余所有渲染出来的文本与属性（文档正文排除）

## 重新生成词表

```bash
# 指向你本机的中文版 DCSS 安装目录（含 dat/i18n/zh/source.txt 的那一层）
node tools/build-zh-dict.mjs --src "<你的 DCSS 安装>/dat"
node tools/build-zh-descript.mjs --src "<你的 DCSS 安装>/dat"
```

## 已知边界（诚实列出）

1. **描述正文（examine）**：按标题里的英文名查 `data/zh-descript.json`
   （2,343 条分类记录 + 7,153 组整段配对 + 139 条 `monstatus`，来自中文版 `dat/descript/zh`），
   并按页面类型（法术/怪物/物品/神祇）优先查对应分类；命中时替换散文段与引文、保留数值行。
   **生物面板**（属性表、命中率、速度、攻击表、状态、引言）由 `src/i18n/monster.ts`
   结构化翻译：攻击表按原列起点切片、按中文表头重排；任一格或整块状态未知时整行/整块
   保持英文，不会出现半中半英。未命中的名字仍是英文。
   0.34.1 中文数据没有的 0.35 内容（新法术/怪物/物品/地形/状态/背景、Gale Centaur 等）
   由 `src/i18n/manual-zh.ts` 手写补充（90 个名字 + 78 段完整散文，由
   `tools/build-manual-zh.mjs` 从上游英文原文对齐生成；完整翻译，不删机制与例外）。
   `{{ … }}` 条件文本按引擎解析后的各分支生成键，否则原始模板键匹配不到。
   护符变形表（Skill/HP/…/Shed Tail HP 等列）、`Melds:`、`Mutations Suppressed:`、
   `Stash search prefixes:`、`Menu/colouring prefixes:` 与 `Your skill: …` 由
   `body.ts` 整行/整表结构化翻译，并按原显示列重排（汉字按 2 列计）。
2. **帮助/图鉴/CRT 定宽屏**：预排版英文，未翻译（避免破坏 80 列布局）。
3. **菜单里的固定列行**（法术/技能表）：已在中文下重排为中文列（`menu-columns.ts`、
   `skill-reflow.ts`）；列宽按汉字 2 列计算。
4. **玩家名、聊天、角色存档文件**：不翻译。
5. 词库是 0.34.1 的；连更高版本服务器时未命中的句子会保留英文（不会错译）。
6. **文档（About / What's new）**：整段英文文档不进入逐节点翻译（避免把 "Features" 译成
   地形这类片段错译）。

## 开关

设置 → 语言：中文 / English。默认中文（测试环境默认英文，保证屏幕快照测试仍然断言英文）。
