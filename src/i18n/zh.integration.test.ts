// @vitest-environment happy-dom

// Integration check against the real dictionary (src/i18n/data/zh.json):
// loading, a few known engine strings, item grammar and the safety rules.
// Runs in English for every other test in the repo; this one flips to Chinese
// explicitly and flips back.
import { afterAll, describe, expect, it } from 'vitest'
import { initI18n, setLang, t, tItem, tLabel, tMore, tTitle, getLang } from './index'
import { translateBody } from './body'
import { loadDescript } from './describe'
import { translateMonsterBody, translateMonsterQuote, translateMonsterStatus } from './monster'

afterAll(() => setLang('en'))

describe('real dictionary', () => {
  it('loads and translates known engine strings', async () => {
    await setLang('zh')
    await initI18n()
    expect(getLang()).toBe('zh')

    expect(t('Okay, then.')).toBe('好的。')
    expect(t('<lightgrey>Spells')).toBe('法术')
    expect(t('Magic Dart')).toBe('魔法飞弹')
    expect(t('Unknown command.')).toBe('未知命令。')
  })

  it('translates sentences with a name in them', async () => {
    await setLang('zh')
    expect(t('You hit the kobold.')).toBe('你击中了狗头人。')
  })

  it('keeps a numeric label row', async () => {
    await setLang('zh')
    expect(t('Base armour rating: 2')).toBe('基础护甲评级: 2')
  })

  it('translates the name captured inside a sentence', async () => {
    await setLang('zh')
    expect(t('You see a +0 sling.')).toBe('你看到了投石索。')
    expect(t('You encounter a ball python.')).toBe('你遭遇了球蟒。')
  })

  it('translates monster equipment detail rows from encounters', async () => {
    await setLang('zh')
    expect(t('You encounter Iiyb the Inquisitive.'))
      .toBe('你遭遇了好奇的伊伊布。')
    expect(t('You encounter Sigmund the Dreaded.'))
      .toBe('你遭遇了恐怖的西格蒙德。')
    expect(t('She is wielding a +5 dagger of holy wrath and carrying a wand of flame.'))
      .toBe('她手持神圣之怒的+5匕首，携带火焰魔杖。')
    expect(t('He is wielding a +0 scythe.')).toBe('他手持镰刀。')
    expect(t('Iiyb screams, “Me am play god!”'))
      .toBe('伊伊布尖叫道：“我就是神！”')
    expect(t('You can’t see any susceptible monsters within range! (Use Z to cast anyway.)'))
      .toContain('范围')
    expect(t('Iiyb zaps a wand.')).toBe('伊伊布挥动了一根魔杖。')
    expect(tItem('a +5 dagger of holy wrath')).toBe('神圣之怒的+5匕首')
    expect(tItem('a +2 dagger (draining)')).toBe('+2匕首（汲取）')
    expect(tItem('a +5 dagger (holy wrath)')).toBe('+5匕首（神圣之怒）')
    expect(tItem('a +0 ring mail')).toBe('环甲')
    expect(tTitle('a - a +0 robe (worn).')).toBe('长袍（已穿戴）')
    expect(tItem('Hand Weapons   (go to first with ))')).toBe('近战武器（) 跳到第一项）')
    expect(t('You encounter Sigmund the Dreaded. He is wielding a +0 scythe.'))
      .toBe('你遭遇了恐怖的西格蒙德。他手持镰刀。')
    expect(t('You encounter Iiyb the Inquisitive. She is wielding a +5 dagger of holy wrath\nand carrying a wand of flame.'))
      .toBe('你遭遇了好奇的伊伊布。她手持神圣之怒的+5匕首，携带火焰魔杖。')
  })

  it('translates a HUD label with a branch depth', async () => {
    await setLang('zh')
    expect(t('Place: Dungeon:1')).toBe('位置: 地牢:1')
    expect(t('Health:')).toBe('生命：')
    expect(t('Cast:')).toBe('施法：')
  })

  it('translates a store row passed through the game-message translator', async () => {
    await setLang('zh')
    expect(t('400 gold a scroll of freezing cloud')).toContain('金币')
  })

  it('does not let the item grammar translate unrelated UI words', async () => {
    await setLang('zh')
    // The engine dictionary has "collapsed" = fell over; a settings button must
    // not pick that up.
    expect(t('Collapsed')).toBe('Collapsed')
  })

  it('translates the everyday combat lines', async () => {
    await setLang('zh')
    expect(t('The rat bites you.')).toBe('老鼠咬了你。')
    expect(t('The rat is severely wounded.')).toBe('老鼠受了重伤。')
    expect(t('A rat is nearby!')).toBe('老鼠就在附近！')
    expect(t('You closely miss the rat.')).toBe('你差一点击中老鼠。')
    expect(t('You hit the rat but do no damage.')).toBe('你击中了老鼠，但没有造成伤害。')
    expect(t('A hobgoblin comes into view.')).toBe('大地精进入了视野。')
    expect(t('The yak snorts and paws the ground.')).toBe('牦牛喷着鼻息，用蹄子刨着地面。')
  })

  it('matches typographic punctuation and HTML entities', async () => {
    await setLang('zh')
    const straight = "You can't see any susceptible monsters within range! (Use Z to cast anyway.)"
    const curly = "You can\u2019t see any susceptible monsters within range! (Use Z to cast anyway.)"
    expect(t(curly)).toBe(t(straight))
    expect(t(curly)).toContain('范围')
    expect(t('You don\u2019t have enough magic to cast this spell.'))
      .toBe(t("You don't have enough magic to cast this spell."))
    // Some wire paths HTML-escape the apostrophe before it reaches the log.
    expect(t('You can&#39;t see any susceptible monsters within range! (Use Z to cast anyway.)'))
      .toBe(t(straight))
  })

  it('translates the regular combat verbs and no-damage shapes', async () => {
    await setLang('zh')
    expect(t('You slash the kobold!')).toBe('你砍了狗头人！')
    expect(t('The kobold slashes you.')).toBe('狗头人砍了你。')
    expect(t('You hit the kobold, but do no damage.')).toBe('你击中了狗头人，但没有造成伤害。')
    expect(t('You completely miss the kobold.')).toBe('你完全没有击中狗头人。')
    // 0.35 dropped the leading article on this one.
    expect(t('Acid dripping from the walls corrodes you.')).toBe('从墙上滴落的酸液腐蚀了你。')
  })

  it('translates the common post-0.34 combat lines', async () => {
    await setLang('zh')
    expect(t('You are caught in the blast!')).toBe('你被爆炸波及了！')
    expect(t('You resist the poison.')).toBe('你抵抗住了毒素。')
    expect(t('The poison wears off.')).toBe('毒素消退了。')
    expect(t('Your life force is drained.')).toBe('你的生命力被吸取了。')
    expect(t('Attack anyway?')).toBe('仍然攻击吗？')
    expect(t('Cast it anyway?')).toBe('仍然施放吗？')
  })

  it('translates compound messages sentence by sentence', async () => {
    await setLang('zh')
    expect(t('The rat squeaks loudly. You hear a shout!')).toBe('老鼠吱吱大叫。你听到一声喊叫！')
    expect(t('The bat leaves your sight.')).toBe('蝙蝠离开了你的视野。')
  })

  it('translates describe body property rows and lone sentences', async () => {
    await setLang('zh')
    const body = [
      '*Rats:     When the wearer is hurt, rats may emerge from it to assist them.',
      'rPois:     It protects you from poison.',
      'Str-1:     It affects your strength (-1).',
      'If you take off this armour:',
      'It falls into the ‘Staves’ category. It is a one-handed weapon.',
      'You found it on level 3 of the Lair of Beasts.',
    ].join('\n')
    const out = translateBody(body)
    expect(out).toContain('鼠群:')
    expect(out).toContain('毒抗：')
    expect(out).toContain('它保护你免受毒素侵袭。')
    expect(out).toContain('它影响你的力量（-1）。')
    expect(out).toContain('如果你脱下这件护甲：')
    expect(out).toContain('它属于“法杖”类别。')
    expect(out).toContain('你在兽巢第 3 层找到了它。')
  })

  it('translates full spell describe metadata and warnings as structured fields', async () => {
    await setLang('zh')
    const out = translateBody([
      'Level: 4     School: Air     Fail: 28%',
      'Power: 9%',
      'Damage: 2d (2-18) (max 2d (15-31))',
      'Range: 7',
      'Noise: whisper',
      'Defences: Defence: 3',
      'Resists: None',
      'Miscasting this spell causes magic contamination and also deals up to 20 electric damage.',
      'With your current stats and equipment, training Air Magic to 6.5 would reduce your failure rate to 10%. This would take about 2.7 XLs.',
      "You aren't experienced enough to cast this spell.",
    ].join('\n'))
    expect(out).toContain('等级：4  学派：气系  失败率：28%')
    expect(out).toContain('威力：9%')
    expect(out).toContain('伤害：2d (2-18) (最高 2d (15-31))')
    expect(out).toContain('射程：7')
    expect(out).toContain('噪音：耳语')
    expect(out).toContain('防御：Defence: 3')
    expect(out).toContain('抗性：None')
    expect(out).toContain('施法失误会造成魔法污染，并额外造成最多 20 点电击伤害。')
    expect(out).toContain('以你当前的属性和装备，把Air Magic训练到 6.5 可将失败率降到 10%。这大约需要 2.7 个等级。')
    expect(out).toContain('你的经验等级不足，无法施放此法术。')
  })

  it('translates god and monster speech lines', async () => {
    await setLang('zh')
    await loadDescript()
    expect(t('Ashenzari says: Partake of my vision. Partake of my curse.')).toBe(
      '艾申扎利说：分享我的视野。分担我的诅咒。',
    )
  })

  it('translates a known item brand inside its noun', async () => {
    await setLang('zh')
    expect(t('You see here a parchment of Volatile Blastmotes.')).toBe(
      '你在这里看到不稳定爆尘的羊皮纸。',
    )
  })

  it('translates the names the engine dictionary lacks', async () => {
    await setLang('zh')
    expect(tItem('a fire dragon')).toBe('火龙')
    expect(tItem('a bog mummy')).toBe('沼泽木乃伊')
    expect(tItem('a book of fire')).toBe('火之书')
    expect(tItem('a wand of roots')).toBe('根须魔杖')
    expect(tItem('a runed door')).toBe('刻文的门')
    expect(tTitle('A stone staircase leading down')).toBe('向下的石楼梯')
    expect(t('You see a staircase to the Lair.')).toBe('你看到了通往兽巢的楼梯。')
  })

  it('translates aim rows', async () => {
    await setLang('zh')
    expect(t('Aim: an endoplasm (100% to hit)')).toContain('瞄准：')
    expect(t('Aim: a goblin, wielding a +0 dagger (moderately wounded, 100% to hit)')).toBe(
      '瞄准：地精，手持匕首（中伤，命中率 100%）',
    )
    expect(
      t('Aim: a kobold, wielding a +0 whip and quivering stones (severely wounded, 100% to hit)'),
    ).toContain('备有石头')
  })

  it('translates single-word species names and new-version prose', async () => {
    await setLang('zh')
    await loadDescript()
    expect(tItem('Gnoll')).toBe('豺狼人')
    expect(tItem('Human')).toBe('人类')
    expect(tItem('Mummy')).toBe('木乃伊')
    expect(tItem('Gale Centaur')).toBe('疾风半人马')
    expect(t('Powerful equine hybrids who trace their ancestry to the four winds themselves, Gale Centaurs are at their strongest while galloping swiftly towards foes.')).toContain('疾风半人马')
  })

  it('translates hand-written 0.35 additions', async () => {
    await setLang('zh')
    await loadDescript()
    expect(tItem('acid blob')).toBe('酸液团')
    expect(tItem('potion of mist')).toBe('雾之药水')
    expect(tItem('Pacify')).toBe('安抚')
    expect(tItem('Mystic')).toBe('秘术师')
    expect(t('Casting: Sirocco (safe; 1% risk of failure)')).toBe('施法：热风（安全；失败率 1%）')
    expect(t('Casting: Bolt of Antimagic (safe; 1% risk of failure)')).toBe('施法：反魔法闪电（安全；失败率 1%）')
  })

  it('carries the complete 0.35 prose, not a summary', async () => {
    await setLang('zh')
    await loadDescript()
    const prose = t('The dried remains of a tail shed under duress. Partially transforms the user into a hypnogecko, a reptile with a remarkable degree of metachrosis. Their skin naturally changes colour to blend in with their surroundings, making them stealthy, and when badly injured, they reflexively shed their own tail and make it scintillate with bright colours as a decoy - allowing them to either flee or even strike at their distracted predators from a blind spot.')
    expect(prose).toContain('断尾闪耀鲜艳色彩作为诱饵')
    expect(prose).toContain('盲区袭击被分心的掠食者')
    expect(prose.length).toBeGreaterThan(100)
    // mako-conditioned upstream text is resolved before it reaches the wire;
    // the resolved variant must be in the table too.
    const vision = t('A small charm bearing the likeness of an eye. It gives the wearer supernatural sight, allowing them to perceive the clouds of magical residue left behind whenever beings cast spells. Touching those clouds allows them to convert that leftover magic into unnerring projectiles against nearby foes. This third eye even allows one to see from further distances than would otherwise be possible, but be warned - creatures perceived this way will perceive you back.')
    expect(vision).toContain('反过来看见你')
    expect(vision).not.toContain('{{')
  })

  it('translates generated item names without leaving the sentence English', async () => {
    await setLang('zh')
    const names = [
      'a knobbly wooden ring', 'a tiny brass amulet', 'a scratched steel ring',
      'a bubbling murky potion', 'a silvery inky potion', 'a gilded opal ring',
      'a runed granite ring', 'a blackened copper amulet', 'a lumpy glass ring',
      'a chipped bone ring', 'a tattered leather ring', 'a scorched marble ring',
      'a jewelled long sword', 'a crooked short sword', 'a forked spear',
      'a tapered dagger', 'a worn robe', 'a lead ring', 'a fluorescent potion',
      'a platinum amulet', 'a citrine ring', 'a jasper ring', 'a soapstone ring',
      'a filigree ring', 'a beryl ring', 'a cameo amulet',
    ]
    for (const name of names) {
      expect(tItem(name), name).toMatch(/[\u4e00-\u9fff]/)
      expect(tItem(name), name).not.toMatch(/^a /)
    }
  })

  it('translates item names inside sentences', async () => {
    await setLang('zh')
    expect(tItem('a parchment of Call Canine Familiar')).toBe('呼唤犬类使魔的羊皮纸')
    expect(t('You pick up a parchment of Call Canine Familiar and begin reading...')).toContain('呼唤犬类使魔的羊皮纸')
    expect(t('You see here a dagger and a scratched steel ring.')).toContain('磨损的钢戒指')
    expect(t('The kobold is quivering stones.')).toBe('狗头人正备有石头。')
  })

  it('translates the menu nav keyhelp', async () => {
    await setLang('zh')
    const out = tMore('[Up|Down] select  [PgDn|>] page down  [Esc] exit')
    expect(out).toContain('选择')
    expect(out).toContain('下翻页')
    expect(out).toContain('退出')
    const spellFooter = tMore('5 spell levels left\n[Tab] Memorise | Describe | Hide | Show  [Ctrl-F] Search  [?] Help  [Esc] Exit')
    expect(spellFooter).toBe('5 个法术等级可用\n[Tab] 记忆 | 描述 | 隐藏 | 显示  [Ctrl-F] 搜索  [?] 帮助  [Esc] 退出')
  })

  it('translates the spell prompt and miscast warning', async () => {
    await setLang('zh')
    expect(t('Memorise Frozen Ramparts, consuming 3 spell levels and leaving 4?')).toBe(
      '记忆冰冻壁垒，消耗 3 个法术等级，剩余 4？',
    )
    expect(t('The spell is quite dangerous to miscast (5% risk of failure)! Continue anyway?')).toBe(
      '这个法术失败风险很高（5%）！仍要继续吗？',
    )
    expect(t('Your icy armour will break if you move. Continue?')).toBe('移动会使你的冰甲破碎。要继续吗？')
  })

  it('keeps the actor/weapon/target order for three-slot sentences', async () => {
    await setLang('zh')
    expect(t('The orc hits your ice beast with a +0 hand axe of flaming.')).toBe(
      '兽人用烈焰的手斧击中了你的冰兽。',
    )
  })

  it('translates poison ticks and destroyed lines', async () => {
    await setLang('zh')
    expect(t('mildly poisoned (25 -> 20)')).toBe('轻度中毒（25 → 20）')
    expect(t('The nameless horror is destroyed!')).toBe('无名恐怖被摧毁了！')
    expect(t('It is immune to acid and corrosion and blinding; and resistant to drowning.')).toBe(
      '它免疫酸、腐蚀与致盲，并抗溺水。',
    )
    expect(t('It inflicts 1d5 acid damage when struck in melee.')).toBe(
      '近战被击中时会造成 1d5 点酸伤害。',
    )
  })

  it('builds artefact names with property tokens and keeps the count', () => {    const cloak = tItem('i - the +2 ratskin cloak {*Rats rPois rN+ Str-1 Int-1 Dex+1}.')
    expect(cloak).toContain('鼠皮斗篷')
    expect(cloak).toContain('毒抗')
    expect(cloak).toContain('敏捷+1')
    expect(tItem('2 scrolls labelled GODAM VEULI')).toContain('×2')
    expect(tItem('a - 202 gold a runed buckler')).toContain('202 金币')
    expect(tItem('g - the ring "Voer" {rF+ MP+9}')).toContain('「Voer」')
  })

  it('builds item names, and refuses unknowns', () => {
    expect(tItem('a - dagger')).toBe('a - 匕首')
    expect(tItem('+1 dagger of venom')).toBe('淬毒的+1匕首')
    expect(tItem('a flibbertigibbet gizmo')).toBe('（flibbertigibbet）小装置')
  })

  it('translates shop row variants, shop title, footer commands, and shortage messages', async () => {
    await setLang('zh')
    expect(tItem('d - 400 gold a scroll of freezing cloud')).toContain('400 金币')
    expect(tItem('d - 12 gold 2 curare darts')).toContain('金币')
    expect(tItem('d - 50 gold a potion of berserk rage (unknown)')).toContain('未知')
    expect(tItem('d - 730 gold a +2 cloak of resistance {rF++ rC++ Will++}')).toContain('金币')
    expect(tTitle("Welcome to Leluj's General Store! What would you like?")).toBe('欢迎光临Leluj的杂货店！想买点什么？')
    expect(tMore('[Esc] exit  [!] buy/examine items  [a-i] mark item for purchase  [/] sort (type)')).toContain('标记购买')
    expect(t('You are short 130 gold pieces for the purchase.')).toBe('你还差 130 金币才能购买。')
  })

  it('translates dynamic titles', () => {
    expect(tTitle('Gear: 1/52 gear slots')).toBe('装备：1/52')
    // Describe headers carry the article as engine framing.
    expect(tTitle('A sky beast.')).toBe('天空兽')
    expect(tTitle('an endoplasm')).toBe('内质怪')
  })

  it('translates its own UI labels', () => {
    expect(tLabel('Play offline')).toBe('离线游戏')
    expect(tLabel('Control sets')).toBe('控制方案')
  })
})

// The monster page is built from engine strings: a stat row whose cells carry
// colour tags, a to-hit line, the speed line, an attack table, the notice
// chance, and the Status/Quote blocks. None of them has a dictionary key, so
// these run through the structural rules against the real database.
describe('monster panel with the live dictionary', () => {
  it('translates a whole panel', async () => {
    await setLang('zh')
    await loadDescript()
    const body = [
      'A small rat.',
      '',
      '<lightgrey>Max HP: 3          </lightgrey><lightgrey>Will: +         </lightgrey>'
        + '<lightgrey>AC: 1           </lightgrey><lightgrey>EV: 15          </lightgrey>',
      '<lightgrey>Threat: Low         </lightgrey><lightgrey>Class: Natural     </lightgrey>'
        + '<lightgrey>Size: Little    </lightgrey><lightgrey>Int: Animal</lightgrey>',
      '',
      'Speed: 110% (attack: 100%, travel: 80%)',
      'You have about 85% to hit with your hands and 50% to hit with your off-hand punch (at present).',
      'They have a 5% chance to notice you each turn.',
      '',
      'Attack          Max Damage    Range    After Damaging Hits',
      'Bite            3             1        Poison',
      '2x Claw         5             3        Fire damage (max 5 each)',
      'Throw: 3 darts   9             7        Poison and slowing',
      '',
      'It can see invisible.',
      'It is immune to poison, fire and negative energy.',
      'It is vulnerable to silver and hated by Zin.',
      'It inflicts 1d5 acid damage when struck in melee.',
    ].join('\n')

    const out = translateMonsterBody(body)
    // Stat row: labels and values both translated, colour tags preserved.
    expect(out).toContain('最大生命')
    expect(out).toContain('意志')
    expect(out).toContain('威胁')
    expect(out).toContain('类别')
    expect(out).toContain('体型')
    expect(out).toContain('智力')
    expect(out).toContain('自然')
    expect(out).toContain('动物')
    expect(out).not.toContain('Max HP')
    expect(out).not.toMatch(/Class:/)

    // Lines and prose.
    expect(out).toContain('速度：110%（攻击：100%，移动：80%）')
    expect(out).toContain('你有约 85% 的几率用你的双手命中')
    expect(out).toContain('另有 50% 的几率用你的副手拳击命中（目前）')
    expect(out).toContain('它们每回合有 5% 的几率注意到你')
    expect(out).toContain('它免疫毒素、火焰与负能量')
    expect(out).toContain('它惧怕银，并被辛厌恶')
    expect(out).toContain('近战被击中时会造成 1d5 点强酸伤害')

    // Attack table: every cell translated, columns still aligned.
    const lines = out.split('\n')
    const header = lines.find((l) => l.startsWith('攻击'))
    expect(header).toBeTruthy()
    expect(header).toContain('最大伤害')
    expect(header).toContain('射程')
    expect(header).toContain('命中后效果')
    expect(lines.some((l) => /^咬\s+3\s+1\s+毒素$/.test(l))).toBe(true)
    expect(lines.some((l) => /^2x 爪击\s+5\s+3\s+火焰伤害（每次最大 5）$/.test(l))).toBe(true)
    expect(lines.some((l) => /^投掷：.+9\s+7\s+毒素与减速$/.test(l))).toBe(true)
  })

  it('translates a multi-paragraph status block and its tag', async () => {
    await setLang('zh')
    await loadDescript()
    // The engine indents continuation lines and turns the blank line inside
    // the body into a whitespace-only line.
    const status = [
      '<white>Asleep:<lightgrey>',
      '   This creature is unable to move, act, block, or dodge. Any hostile action',
      '   will awaken it.',
      '   ',
      '   <blue>Your melee attacks against this creature will deal greatly',
      '   increased damage.</blue>',
    ].join('\n')
    const out = translateMonsterStatus(status)
    expect(out).toContain('<white>睡眠：')
    expect(out).toContain('这个生物无法移动、行动、格挡或闪避')
    expect(out).toContain('你对该生物进行的近战攻击将造成大幅增加的伤害')
    // Both paragraphs stay in the block; nothing is left in English.
    expect(out).not.toContain('This creature')
    expect(out).not.toContain('Your melee attacks')
    const followUp = out.split('\n').filter((l) => l.startsWith('   '))
    expect(followUp.length).toBeGreaterThan(1)
  })

  it('translates the Quote block from the database', async () => {
    await setLang('zh')
    await loadDescript()
    expect(translateMonsterQuote(
      'Draconians are versatile hybrids. They mature when reaching level 7 and develop a colour.',
    )).toBe('龙人是适应面很广的混种生物。他们到达7级时便会成熟，并显现出一种颜色。')
    // Quotes newer than the database stay as the server sent them.
    const newer = 'Some line the 0.34.1 database never had.'
    expect(translateMonsterQuote(newer)).toBe(newer)
  })

  it('keeps unmatchable rows entirely English', async () => {
    await setLang('zh')
    const out = translateMonsterBody([
      'Attack          Max Damage    Range    After Damaging Hits',
      'Bite            3             1        Flibbertigibbet',
    ].join('\n'))
    expect(out).toContain('Bite            3             1        Flibbertigibbet')
    expect(out).not.toContain('咬')
  })
})

describe('talisman form panel', () => {
  // The form table is composed in C++ from four-cell fragments and sent as a
  // transposed table. Each header cell is a standalone dictionary key, so a
  // missing entry leaves English columns in the middle of a Chinese table.
  it('translates every form-table header cell', async () => {
    await setLang('zh')
    await initI18n()
    const out = translateBody([
      '<lightgrey>      Skill   Regen   Shed Tail HP   Distraction Stab Chance</lightgrey>',
      'Min   0       +0.20   12             +5%',
      'Max   7       +0.20   24             +15%',
      'Cur   0.0     +0.20   12             +5%',
    ].join('\n'))
    expect(out).toContain('技能')
    expect(out).toContain('再生')
    expect(out).toContain('断尾生命')
    expect(out).toContain('分心背刺几率')
    expect(out).toContain('最小')
    expect(out).toContain('最大')
    expect(out).toContain('当前')
    expect(out).not.toMatch(/Shed Tail|Distraction|Skill\s+Regen/)

    // Chinese labels are narrower than the English ones; the following cells
    // must stay at their original display columns (CJK counts as two).
    const width = (s: string): number => [...s]
      .reduce((n, ch) => n + (/[^\x00-\xff]/.test(ch) ? 2 : 1), 0)
    const columns = (line: string): number[] => [...line.matchAll(/\S+/g)]
      .map((m) => width(line.slice(0, m.index)))
    const lines = out.split('\n').map((l) => l.replace(/<[^>]*>/g, ''))
    expect(columns(lines[0])).toEqual([6, 14, 22, 37])
    expect(columns(lines[1])).toEqual([0, 6, 14, 22, 37])
    expect(columns(lines[2])).toEqual([0, 6, 14, 22, 37])
  })

  it('translates the describe footer labels without touching search tokens', async () => {
    await setLang('zh')
    const out = translateBody([
      'Stash search prefixes: {inventory} {talisman}',
      'Menu/colouring prefixes: (identified)',
    ].join('\n'))
    expect(out).toContain('储藏搜索前缀：{inventory} {talisman}')
    expect(out).toContain('菜单/着色前缀：（已鉴定）')
  })

  it('translates the melds, suppressed-mutation and skill-target lines', async () => {
    await setLang('zh')
    const out = translateBody([
      'Your skill: 0.0; use <white>(s)</white> to set 7.0 as a target for Shapeshifting.',
      '    At 100% training you would reach 7.0 in about 3.9 XLs.',
      '',
      'Melds: Body Armour, Gloves, Boots, Barding',
      'Mutations Suppressed: Anatomy, Substance, Blood, Bones, Hands',
    ].join('\n'))
    expect(out).toContain('你的技能：0.0；使用 (s) 可将变形术的目标设为 7.0。')
    expect(out).toContain('按 100% 训练度，大约 3.9 个等级后可达到 7.0。')
    expect(out).toContain('融合部位：身体护甲、手套、靴子、马铠')
    expect(out).toContain('抑制的突变：解剖结构、物质、血液、骨骼、双手')
    // No quarantined leftovers and no stray dictionary matches ("a" → 一阵).
    expect(out).not.toContain('（')
    expect(out).not.toContain('一阵')
  })

  it('keeps the skill line English when the skill name is unknown', async () => {
    await setLang('zh')
    const line = 'Your skill: 0.0; use (s) to set 7.0 as a target for Flibbertigibbeting.'
    expect(translateBody(line)).toBe(line)
  })

  it('never feeds prose through the loose item-name fallback', async () => {
    await setLang('zh')
    await initI18n()
    // These used to become "（Melds:）身体（Armour,）…" / "（to）（set）…变形术".
    expect(tItem('Melds: Body Armour, Gloves, Boots, Barding'))
      .toBe('Melds: Body Armour, Gloves, Boots, Barding')
    expect(tItem('to set 7.0 as a target for Shapeshifting.'))
      .toBe('to set 7.0 as a target for Shapeshifting.')
    // A real item name still gets the quarantined-qualifier treatment.
    expect(tItem('a flibbertigibbet gizmo')).toBe('（flibbertigibbet）小装置')
  })
})
