// @vitest-environment happy-dom

// Integration check against the real dictionary (src/i18n/data/zh.json):
// loading, a few known engine strings, item grammar and the safety rules.
// Runs in English for every other test in the repo; this one flips to Chinese
// explicitly and flips back.
import { afterAll, describe, expect, it } from 'vitest'
import { initI18n, setLang, t, tItem, tLabel, tMore, tTitle, getLang } from './index'
import { translateBody } from './body'
import { loadDescript } from './describe'

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

  it('translates a HUD label with a branch depth', async () => {
    await setLang('zh')
    expect(t('Place: Dungeon:1')).toBe('位置: 地牢:1')
    expect(t('Health:')).toBe('生命：')
    expect(t('Cast:')).toBe('施法：')
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
    expect(out).toContain('毒抗:')
    expect(out).toContain('它保护你免受毒素伤害。')
    expect(out).toContain('它影响你的力量（-1）。')
    expect(out).toContain('如果你脱下这件护甲：')
    expect(out).toContain('它属于“法杖”类别。')
    expect(out).toContain('你在兽巢第 3 层找到了它。')
  })

  it('translates god and monster speech lines', async () => {
    await setLang('zh')
    await loadDescript()
    expect(t('Ashenzari says: Partake of my vision. Partake of my curse.')).toBe(
      '艾申扎利说：分享我的视野。分担我的诅咒。',
    )
  })

  it('keeps the noun when an item brand is unknown', async () => {
    await setLang('zh')
    expect(t('You see here a parchment of Volatile Blastmotes.')).toBe(
      'You see here a parchment of Volatile Blastmotes.',
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

  it('translates the menu nav keyhelp', async () => {
    await setLang('zh')
    const out = tMore('[Up|Down] select  [PgDn|>] page down  [Esc] exit')
    expect(out).toContain('选择')
    expect(out).toContain('下翻页')
    expect(out).toContain('退出')
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
    expect(tItem('a wobbling gizmo')).toBe('a wobbling gizmo')
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

