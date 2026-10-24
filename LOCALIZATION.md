# 中文化说明（display-only localization）

这份改动只作用于**渲染层**：游戏消息、菜单、HUD、PocketZot 自己的界面在写到屏幕前被翻译成中文。
`src/game/` 里的英文解析（提示按钮切分、法术列表定宽列、技能表网格、状态/神明判断、怪物名过滤、
符文词表等）**一行都没有改**，所以触控、快捷键、排序、存档行为与英文版完全一致。

## 结构

| 文件 | 作用 |
|---|---|
| `src/i18n/data/zh.json` | 由 DCSS 0.34.1 汉化版的 `dat/i18n/zh/source.txt` 生成的 13,984 条对照表（懒加载 chunk，brotli 约 320 KB）|
| `src/i18n/supp-zh.ts` | 词库缺口的手工补充：菜单分类词、提示问句、常见物品名词 |
| `src/i18n/ui-zh.ts` | PocketZot 自己的界面文案（登录/大厅/设置/离线大厅/记录/操作名）|
| `src/i18n/translate.ts` | 匹配器：整句精确匹配 → 去掉颜色标记/热键前缀 → 带占位符的模板 → `label: 12` 规则；**匹配不成功一律返回原文** |
| `src/i18n/items.ts` | 物品名语法：`+1 dagger of venom` → `淬毒的+1匕首`、`2 black potions` → `黑色药水×2` |
| `src/i18n/titles.ts` | 动态标题：`Gear: 1/52 gear slots`、`Casting: …` 等 |
| `src/i18n/index.ts` | `t()` / `tItem()` / `tTitle()` / `tLabel()`、语言状态与懒加载 |
| `src/i18n/describe.ts` + `data/zh-descript.json` | 详情面板的散文替换：按标题里的英文名查 `dat/descript/zh`，只换散文段，数值行保留 |
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

## 未命中清单（提高覆盖率的主要手段）

开发环境左下角有一个「未命中 N」小按钮：它统计所有“有英文字符但没翻出来”的句子，
点一下会下载 `i18n-misses.txt`（TSV：次数<TAB>原文，按频次排序）。把这些高频句补进
`src/i18n/supp-zh.ts` 即可，不需要猜。

## 接入点（都只是“显示副本”）

- `src/views/message-log.ts`：日志整行（保留行首颜色标签；切语言时按原文重渲染）
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
   （2,343 条分类记录 + 7,043 组整段配对，来自中文版 `dat/descript/zh`），并按页面类型
   （法术/怪物/物品/神祇）优先查对应分类；命中时替换散文段与引文、保留数值行。
   未命中的名字仍是英文。
2. **帮助/图鉴/CRT 定宽屏**：预排版英文，未翻译（避免破坏 80 列布局）。
3. **菜单里的固定列行**（法术/技能表）：已在中文下重排为中文列（`menu-columns.ts`、
   `skill-reflow.ts`）；列宽按汉字 2 列计算。
4. **玩家名、聊天、角色存档文件**：不翻译。
5. 词库是 0.34.1 的；连更高版本服务器时未命中的句子会保留英文（不会错译）。
6. **文档（About / What's new）**：整段英文文档不进入逐节点翻译（避免把 "Features" 译成
   地形这类片段错译）。

## 开关

设置 → 语言：中文 / English。默认中文（测试环境默认英文，保证屏幕快照测试仍然断言英文）。
