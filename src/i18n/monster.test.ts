// @vitest-environment happy-dom

// Monster describe panel: to-hit / notice / speed lines, the attack table and
// the Status/Quote blocks are all engine-composed, so they have no dictionary
// key. These cover the structural rules and, just as important, that an
// unknown cell leaves the whole row in English instead of mixing languages.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { setLang } from './index'
import { loadDescript } from './describe'
import {
  translateMonsterBody, translateMonsterLine, translateMonsterQuote, translateMonsterStatus,
} from './monster'

beforeAll(async () => {
  await setLang('zh')
  await loadDescript()
})

afterAll(() => setLang('en'))

describe('monster panel lines', () => {
  it('translates the to-hit line with the off-hand and state suffixes', () => {
    expect(translateMonsterLine(
      'You have about 85% to hit with your hands and 50% to hit with your off-hand punch.',
    )).toBe('你有约 85% 的几率用你的双手命中，另有 50% 的几率用你的副手拳击命中。')
    expect(translateMonsterLine(
      'You have about 85% to hit with your hands and 50% to hit with your off-hand punch (at present).',
    )).toContain('（目前）')
    expect(translateMonsterLine(
      'You have about 85% to hit with your hands (while incapacitated).',
    )).toContain('（在无力化状态下）')
    expect(translateMonsterLine(
      'You have about 60% to hit with your hands (while you are blinded and from distance 3).',
    )).toContain('（当你失明且距离 3 时）')
  })

  it('translates the notice chance for singular and plural monsters', () => {
    expect(translateMonsterLine('It has a 5% chance to notice you each turn.'))
      .toBe('它每回合有 5% 的几率注意到你。')
    expect(translateMonsterLine('They have a 5% chance to notice you each turn.'))
      .toBe('它们每回合有 5% 的几率注意到你。')
  })

  it('translates the speed line and its clauses', () => {
    expect(translateMonsterLine('Speed: 110% (attack: 100%, travel: 80%)'))
      .toBe('速度：110%（攻击：100%，移动：80%）')
    expect(translateMonsterLine('Speed: 100% (but often pauses)'))
      .toBe('速度：100%（但经常停顿）')
    expect(translateMonsterLine('Speed: 50% (normally travels slower than you)'))
      .toBe('速度：50%（通常比你慢）')
    // The travel comment is a second parenthetical after the energy list.
    expect(translateMonsterLine('Speed: 100% (attack: 150%, travel: 50%) (but often pauses)'))
      .toBe('速度：100%（攻击：150%，移动：50%，但经常停顿）')
    expect(translateMonsterLine('Speed: 100% (travel: 50%) (normally travels faster than you)'))
      .toBe('速度：100%（移动：50%，通常比你快）')
  })

  it('translates generated demon lord descriptions component by component', () => {
    expect(translateMonsterLine(
      'One of the many lords of Pandemonium, Gloorx Vloq has an armoured red body with small, bat-like wings and a cubic structure in place of a head. It smells of brimstone. It glows with a malevolent light.',
    )).toBe('群魔殿众多领主之一，Gloorx Vloq拥有覆满铠甲的红色身躯，长着小巧的蝙蝠状翅膀，以及一个立方体结构代替头部。它散发着硫磺味。它散发着邪恶的光芒。')
    // No wings, a two-word colour and no trailing sentences.
    expect(translateMonsterLine(
      'One of the many lords of Pandemonium, Mnoleg has an obese light blue body and a brain for a head.',
    )).toBe('群魔殿众多领主之一，Mnoleg拥有臃肿的浅蓝色身躯，以及以大脑为头。')
    // An unknown component must keep the whole sentence English.
    expect(translateMonsterLine(
      'One of the many lords of Pandemonium, X has a fat body and a brain for a head. It smells of roses.',
    )).toBeNull()
  })

  it('translates generated mutant beast descriptions', () => {
    expect(translateMonsterLine(
      'It sports a set of venomous tails, and it flies swiftly and unpredictably. It is a juvenile, no longer larval but below its mature strength.',
    )).toBe('它长有一组有毒的尾巴，并且飞行迅捷且难以预测。它是幼兽，已脱离幼体阶段，但尚未达到成年力量。')
    // The "breath" facet is joined as "It" + "s breath ..." by the engine.
    expect(translateMonsterLine(
      'Its breath smoulders ominously. It is a primal beast, the most powerful of its kind.',
    )).toBe('它呼吸阴燃着，预示不祥。它是原初之兽，是同族中最强大的。')
    // A facet-less beast starts with a space in the engine output.
    expect(translateMonsterLine(' It is mature, stronger than a juvenile but weaker than its elders.'))
      .toBe('它已成熟，比幼兽强壮，但弱于长者。')
  })

  it('translates ghost and illusion frames, target lines and hide sentences', () => {
    expect(translateMonsterLine('The apparition of Aria the Firebug, a legendary Deep Elf Fire Elementalist of Vehumet.'))
      .toBe('Aria the Firebug, a legendary Deep Elf Fire Elementalist of Vehumet的亡魂。')
    expect(translateMonsterLine('An illusion of Aria the Firebug, a legendary Deep Elf Fire Elementalist.'))
      .toBe('Aria the Firebug, a legendary Deep Elf Fire Elementalist的幻影。')
    expect(translateMonsterLine('It is currently targeted by your kobold.'))
      .toBe('它目前正被你的狗头人锁定。')
    expect(translateMonsterLine('It is currently targeting the orc.'))
      .toBe('它目前正锁定兽人。')
    expect(translateMonsterLine('It is currently targeted by:')).toBe('它目前正被以下对象锁定：')
    expect(translateMonsterLine('  your kobold')).toBe('  你的狗头人')
    expect(translateMonsterLine(
      'If it is slain, it may be possible to recover its hide, which can be used as armour.',
    )).toBe('若它被击杀，可能可以剥下它的皮，用来制作护甲。')
    expect(translateMonsterLine(
      'If they are slain, it may be possible to recover their hide, which can be used as armour.',
    )).toBe('若它们被击杀，可能可以剥下它们的皮，用来制作护甲。')
  })

  it('translates the program bug warning', () => {
    expect(translateMonsterLine(
      'If this monster is a "program bug", then it\'s recommended that you save your game and reload. Please report monsters who masquerade as program bugs or run around the dungeon without a proper description to the authorities.',
    )).toBe('如果这个怪物是“程序错误”，建议你保存游戏并重新加载。请向相关部门举报那些伪装成程序错误，或在地牢里游荡却没有正常描述的怪物。')
  })

  it('translates the computed Regen row', () => {
    expect(translateMonsterBody('Regen: 2/turn')).toBe('再生：每回合 2')
    expect(translateMonsterBody('Regen: None')).toBe('再生：无')
    expect(translateMonsterBody('Size: V. Small    Regen: 3/turn'))
      .toContain('再生：每回合 3')
  })

  it('keeps unknown lines English', () => {
    expect(translateMonsterLine('You have about 85% to hit with your flooble.')).toBeNull()
    expect(translateMonsterLine('Some other sentence.')).toBeNull()
  })
})

describe('attack table', () => {
  const body = [
    'Attack          Max Damage    Range    After Damaging Hits',
    'Bite            3             1        Poison',
    '2x Claw         5             3        Fire damage (max 5 each)',
    'Throw: 3 darts   9             7        Poison and slowing',
    '',
  ].join('\n')

  it('translates every cell and keeps the columns', () => {
    const out = translateMonsterBody(body)
    const lines = out.split('\n')
    expect(lines[0]).toContain('攻击')
    expect(lines[0]).toContain('最大伤害')
    expect(lines[0]).toContain('射程')
    expect(lines[0]).toContain('命中后效果')
    expect(lines[1]).toMatch(/^咬\s+3\s+1\s+毒素$/)
    expect(lines[2]).toMatch(/^2x 爪击\s+5\s+3\s+火焰伤害（每次最大 5）$/)
    expect(lines[3]).toMatch(/^投掷：.+9\s+7\s+毒素与减速$/)
    // Fixed-width: the gap after the attack column stays at least 3 spaces.
    expect(lines[1]).toMatch(/\S {3,}\S/)
  })

  it('leaves a row with an unknown flavour entirely English', () => {
    const out = translateMonsterBody([
      'Attack          Max Damage    Range    After Damaging Hits',
      'Bite            3             1        Flibbertigibbet',
    ].join('\n'))
    expect(out).toContain('Bite            3             1        Flibbertigibbet')
    expect(out).not.toContain('咬')
  })

  it('handles the range-only and bonus-only table layouts', () => {
    const noBonus = translateMonsterBody([
      'Attack          Max Damage    Range',
      'Claw            4             2',
    ].join('\n'))
    expect(noBonus).toContain('爪击')
    expect(noBonus).toContain('射程')

    const noRange = translateMonsterBody([
      'Attack          Max Damage    Bonus',
      'Claw            4             Poison',
    ].join('\n'))
    expect(noRange).toContain('爪击')
    expect(noRange).toContain('毒素')
  })

  it('keeps the flavour modifiers inside the bonus cell', () => {
    const out = translateMonsterBody([
      'Attack          Max Damage    Range    After Damaging Hits',
      'Claw            4             1        Poison (max 3) and momentary paralysis',
      'Bite            6             1        Drain life (max 3 damage)',
      'Touch           2             1        Cause confusion (if damage dealt)',
      'Constrict       0             1        Begin ongoing constriction (3-6 dam)',
    ].join('\n'))
    const lines = out.split('\n')
    expect(lines[1]).toMatch(/毒素（最大 3）与短暂麻痹$/)
    expect(lines[2]).toMatch(/吸取生命（最大 3）$/)
    expect(lines[3]).toMatch(/造成混乱（若造成伤害）$/)
    expect(lines[4]).toMatch(/开始持续缠绕（3-6 伤害）$/)
  })
})

describe('status and quote', () => {
  it('translates a status tag and takes the body from monstatus.txt', () => {
    const status = [
      '<white>Asleep:<lightgrey>',
      '   This creature is unable to move, act, block, or dodge.',
    ].join('\n')
    const out = translateMonsterStatus(status)
    expect(out).toContain('<white>睡眠：')
    expect(out).toContain('这个生物无法移动')
    expect(out).not.toContain('This creature')
  })

  it('translates a status tag the 0.34.1 dictionary lacks', () => {
    const out = translateMonsterStatus('<white>Inner flame:<lightgrey>\n   Whenever this creature takes damage.')
    expect(out).toContain('体内火焰：')
    expect(out).toContain('受到伤害')
  })

  it('keeps an unknown status block in one language', () => {
    const status = '<white>Unknown thing:<lightgrey>\n   Some untranslated body.'
    expect(translateMonsterStatus(status)).toBe(status)
  })

  it('translates a database quote', () => {
    const quote = 'Draconians are versatile hybrids. They mature when reaching level 7 and develop a colour.'
    expect(translateMonsterQuote(quote)).toBe('龙人是适应面很广的混种生物。他们到达7级时便会成熟，并显现出一种颜色。')
    expect(translateMonsterQuote('An original line.')).toBe('An original line.')
  })
})

describe('panel prose', () => {
  const cases: Array<[string, string]> = [
    ['It is immune to poison, fire and negative energy.', '它免疫毒素、火焰与负能量。'],
    ['It is very resistant to cold.', '它对寒冷有极强抗性。'],
    ['It is susceptible to fire.', '它易受火焰伤害。'],
    ['It is resistant to fire.', '它抗火焰。'],
    ['It is vulnerable to silver and hated by Zin.', '它惧怕银，并被辛厌恶。'],
    ['It is immune to fire, cold; and very resistant to poison; susceptible to silver.',
      '它免疫火焰与寒冷；对毒素有极强抗性；易受银伤害。'],
    ['It has about 70% to hit you.', '它命中你的几率约为 70%。'],
    ['It is an unusual item.', '它是一件不寻常的物品。'],
    [
      'To read a description, press the key listed above.',
      '要阅读描述，请按上方列出的按键。',
    ],
    [
      'To read a description, press the key listed above. (AdB) indicates damage (the sum of A B-sided dice), (x%) indicates the chance to defeat your Will, and (y) indicates the spell range; shown in red if you are in range.',
      '要阅读描述，请按上方列出的按键。(AdB) 表示伤害（A 个 B 面骰子之和），(x%) 表示穿透意志的几率，(y) 表示法术射程；在射程内会显示为红色。',
    ],
    ['It is incapable of using stairs.', '它无法使用楼梯。'],
    ['It can burrow through diggable terrain.', '它能钻过可挖掘的地形。'],
    ['It can use ranged and thrown weapons in melee range.', '它能在近战范围内使用远程和投掷武器。'],
    ['It inflicts 1d5 acid damage when struck in melee.', '近战被击中时会造成 1d5 点强酸伤害。'],
    ['It deals 3d5 fire damage.', '它会造成 3d5 点火焰伤害。'],
    ['It deals 2d4 damage when destroyed.', '它被摧毁时会造成 2d4 点伤害。'],
    ['If struck, it will crumble away soon after.', '若被击中，它很快会崩解。'],
    ['It is quickly melting away.', '它正在迅速融化。'],
    ['It will release all of its jellies when polymorphed.', '它被变形时会释放所有果冻。'],
    [
      'This monster has been temporarily summoned to this location. Killing it yields no experience or items; it is incapable of using stairs.',
      '此怪物是被临时召唤到这里的。击杀它不会获得经验或物品；它无法使用楼梯。',
    ],
  ]

  it.each(cases)('%s', (en, zh) => {
    expect(translateMonsterBody(en)).toBe(zh)
  })

  it('translates colour-tagged stat cells', () => {
    const row = '<lightgrey>Max HP: 3          </lightgrey><lightgrey>Will: +         </lightgrey>'
    const out = translateMonsterBody(row)
    expect(out).toContain('最大生命: 3')
    expect(out).toContain('意志: +')
    expect(out).not.toContain('Max HP')
    expect(out).not.toContain('Will:')
  })

  it('translates Class/Size/Int values', () => {
    const out = translateMonsterBody('Threat: Low         Class: Natural     Size: Little    Int: Animal')
    expect(out).toContain('类别:  自然')
    expect(out).toContain('体型: 小')
    expect(out).toContain('智力: 动物')
  })
})
