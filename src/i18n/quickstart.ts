// DCSS docs/quickstart.txt. Match paragraphs by their English opening so the
// same guide can be rendered at different widths by different servers.
const PARAGRAPHS: ReadonlyArray<readonly [string, string]> = [
  ['So, you want to start playing Crawl straight away', '想跳过手册，直接开始游玩吗？这份指南能帮你尽快上手。'],
  ['I suggest printing it out', '建议在头几局游戏时参照本指南。游戏中连续按两次 `?` 可查看命令列表；也可以试试教程模式，只需几分钟。'],
  ['When you get some more time', '有空时可以查阅 `docs/` 下的 `crawl_manual.txt`，了解更详细的内容。'],
  ['Crawl is a large and very random game', 'Crawl 是一款奇幻地下探险游戏，地牢每局都会随机生成。你的任务是深入地牢，取回佐特之球。'],
  ['Crawl is an RPG', 'Crawl 是继承 Rogue 的角色扮演游戏。画面简洁但信息丰富，绝大多数操作只需按一个键。'],
  ['After starting the program', '启动游戏后，先为角色取一个名字。别花太久：你的第一个角色多半活不了多久。'],
  ['Next you are given menus', '接下来选择种族和职业。山地矮人、牛头人或巨魔战士适合入门；精灵较脆弱，人类较均衡，机制特殊的种族不太适合新手。最后可能还要选择武器，不妨试试斧头。'],
  ['Now you are in the game.', '进入游戏后，界面分为以下三个部分：'],
  ['- the Map takes up', '- 地图位于左上方。中央的 `@` 或角色图块代表你。明亮部分在当前视野内，探索过但当前看不到的地方会变暗。'],
  ['- the Message box', '- 消息区位于地图下方，显示发生的事件，也会询问你如何行动。'],
  ['- the Stats area', '- 状态区位于地图右侧，显示生命值及其他能力指标。'],
  ['Try walking around', '用数字键盘或 Rogue 的 `hjklyubn` 键移动。按 `o` 自动探索，遇到敌人或发现楼梯等重要事物时会停止。'],
  ['If you want to know what a certain character', '按 `x` 查看地图符号的简要说明，再按 `v` 查看详情。`O` 和 `C` 分别开门和关门，`<` 上楼，`>` 下楼。'],
  ['The Dungeon gets more dangerous', '越往地牢深处走，就越危险，也越有趣。迷路时按 `X` 可查看整层地图。'],
  ['After walking around for a while', '探索时会看到地上的物品，也可能遇见怪物。用 `g` 或 `,` 拾取物品，`d` 丢弃物品，`i` 查看物品栏。在物品栏按物品对应的字母可查看详情及可用操作。'],
  ['There are several different types of items:', '常见物品分为以下几类：'],
  ['- **Weapons**', '- 武器（`)`）：按 `w` 持握。'],
  ['- **Armour**', '- 护甲（`[`）：按 `W` 穿戴或脱下。较重的护甲提供更多防护，但可能影响闪避、施法或射击。'],
  ['- **Ammunition**', '- 投掷物（`(`）：用 `f` 或 `F` 投掷。'],
  ['- **Wands**', '- 魔杖（`/`）、卷轴（`?`）和药水（`!`）：用 `V` 激发魔杖，`r` 阅读卷轴，`q` 喝药水。魔杖充能有限，卷轴和药水是一次性物品。尚未鉴定时，卷轴和药水只显示外观；一旦用过某种药水或卷轴，之后就能认出同类物品。'],
  ['- **Rings**', '- 戒指（`=`）和护身符（`"`）通常能提供增益。用 `P` 佩戴，`R` 取下。'],
  ['- **Money**', '- 金币（`$`）：用于在商店购物。'],
  ['There are a few other types of items', '还有一些物品可以留待游玩时探索。'],
  ['You will also run into monsters', '大多数怪物用字母表示。尝试移动到怪物所在格即可攻击它。按 Tab 会自动接近并攻击附近怪物。'],
  ['When you are wounded', '受伤会损失生命值，可在状态区上方查看。生命值会随时间自然恢复，降至零就会死亡。'],
  ['To survive, you will need', '记住以下基本策略，有助于生存：'],
  ['- Rest between encounters.', '- 两次战斗之间记得休息。`s`、`.`、Delete 或数字键盘的 5 等待一回合；`5` 或 Shift 加数字键盘 5 可持续休息，直至恢复。'],
  ['- Never fight more than one monster', '- 尽量不要同时和多个怪物交战。退回走廊，把战斗变成一对一。'],
  ['- Consumable items like scrolls and potions', '- 死后消耗品就用不上了。强敌面前，在战斗开头使用通常比濒死时更有效。也可以在安全处从一叠物品里试用一件，提前鉴定。'],
  ['- Remember to use projectiles', '- 近身交战前，记得先使用远程攻击。'],
  ['- Learn when to run away', '- 遇到打不过的敌人，要懂得撤退。危险的楼层可以跳过，但不要过度依赖这招。'],
  ["Before long, you'll probably", '用不了多久，你的角色可能就会死亡。'],
  ['Death in Crawl is permanent', '死亡不可逆，无法读档重来。`S` 只用于中途保存并退出，以便稍后继续；`Ctrl-Q` 会直接放弃当前角色。'],
  ["Well, that's it for the quick-start guide.", '快速入门到此结束。这些建议能帮助你度过头几局，但游戏机制远不止这些。准备尝试法术、技能和宗教时，可以继续阅读手册。'],
  ['Happy Crawling!', '祝你探索愉快！'],
]

const HEADINGS: Record<string, string> = {
  'Crawl Quick-Start Guide': '地下城探索快速入门',
  'INTRODUCTION TO CRAWL': '游戏简介',
  'STARTING OUT': '开始游戏',
  EXPLORING: '探索地牢',
  ITEMS: '物品',
  MONSTERS: '怪物',
  DEATH: '死亡',
}

export function translateQuickstart(text: string): string | null {
  if (!/^\s*Crawl Quick-Start Guide\s*$/m.test(text)) return null
  // Keep line indices stable for the server's scroller. Keep every shortcut
  // intact by splitting only outside backticked spans.
  const lines = text.split('\n')
  for (let i = 0; i < lines.length;) {
    const source = lines[i].trim()
    const title = Object.prototype.hasOwnProperty.call(HEADINGS, source) ? HEADINGS[source] : undefined
    if (title) { lines[i++] = title; continue }
    let end = i + 1
    while (end < lines.length && lines[end].trim() && !/^\s*-\s/.test(lines[end]) &&
      !Object.prototype.hasOwnProperty.call(HEADINGS, lines[end].trim()) && !/^\s*[-=]{3,}\s*$/.test(lines[end])) end++
    const paragraph = lines.slice(i, end).map((s) => s.trim()).join(' ')
    const pair = PARAGRAPHS.find(([start]) => paragraph.startsWith(start))
    if (!pair) { i++; continue }
    const chars = pair[1].match(/`[^`]*`|[A-Za-z0-9._/-]+|./gu) ?? []
    const size = Math.ceil(chars.length / (end - i))
    for (let j = 0; i < end; i++, j++) lines[i] = chars.slice(j * size, (j + 1) * size).join('').replace(/`/g, '')
  }
  return lines.join('\n').replace(/^Copyright (\d{4}) (.+)$/m, '版权所有 © $1 $2')
}
