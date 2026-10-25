import { describe, expect, it } from 'vitest'
import { compileDict, lookup } from './translate'
import { translateItem } from './items'
import { matchTitle } from './titles'

const dict = new Map<string, string>([
  ['You hit %s.', '你击中了%s。'],
  ['The %s hits you.', '%s击中了你的。'],
  ['Spells', '法术'],
  ['Yes', '是'],
  ['No', '否'],
  ['Skill', '技能'],
  ['Base armour rating: ', '基础护甲值：'],
  ['It can be maximally enchanted to +%s.', '最多可强化到+%s。'],
  ['%s%s.', '坏模板'],
  ["You can't see the kobold.", '你看不到狗头人。'],
  ["You don't hit %s.", '你没有击中%s。'],
  ['a well-known item', '一件著名物品'],
  ['Wait...', '等等……'],
  ['a potion of magic', '魔法药水'],
  ['dagger', '匕首'],
  ['potion', '药水'],
  ['black', '黑色'],
  ['robe', '布袍'],
  ['ring', '戒指'],
  ['protection', '防护'],
  ['venom', '剧毒'],
  ['worn', '已穿戴'],
])

const m = compileDict(dict)

describe('dictionary matcher', () => {
  it('matches exact keys and strips markup', () => {
    expect(lookup(m, 'Spells')?.out).toBe('法术')
    expect(lookup(m, '<lightgrey>Yes')?.out).toBe('是')
  })

  it('fills templates with captured names', () => {
    expect(lookup(m, 'You hit the kobold.')?.out).toBe('你击中了the kobold。')
    expect(lookup(m, 'The kobold hits you.')?.out).toBe('kobold击中了你的。')
  })

  it('never lets two adjacent placeholders match anything', () => {
    // "%s%s." would swallow any sentence ending in a period.
    expect(lookup(m, 'Your foxfire dissipates.')).toBeNull()
  })

  it('fills label rows with a numeric tail', () => {
    expect(lookup(m, 'Base armour rating: 2', { allowLabels: true })?.out).toBe('基础护甲值：2')
    expect(lookup(m, 'Base armour rating: 2')).toBeNull()  // opt-in only
    expect(lookup(m, 'It can be maximally enchanted to +2.')?.out).toBe('最多可强化到+2。')
  })

  it('strips the menu hotkey prefix', () => {
    expect(lookup(m, 'g - a potion of magic')?.out).toBe('魔法药水')
  })

  it('returns null instead of a partial translation', () => {
    expect(lookup(m, 'A sentence nobody translated.')).toBeNull()
  })

  it('reports the captures so callers can translate names inside a sentence', () => {
    const hit = lookup(m, 'You hit the kobold.')
    expect(hit?.tmpl).toBe('你击中了%s。')
    expect(hit?.args).toEqual(['the kobold'])
  })

  it('reports the value tail of a label row', () => {
    const hit = lookup(m, 'Base armour rating: 2', { allowLabels: true })
    expect(hit?.labelTail).toBe('2')
  })

  it('matches typographic punctuation without rewriting the capture', () => {
    // The 0.35 engine emits curly apostrophes; the keys are straight ASCII.
    expect(lookup(m, 'You can\u2019t see the kobold.')?.out).toBe('你看不到狗头人。')
    const hit = lookup(m, 'You don\u2019t hit the kobold\u2019s ghost.')
    expect(hit?.tmpl).toBe('你没有击中%s。')
    expect(hit?.args).toEqual(['the kobold\u2019s ghost'])
    // En/em dashes and the ellipsis behave the same way.
    expect(lookup(m, 'a well\u2013known item')?.out).toBe('一件著名物品')
    expect(lookup(m, 'Wait\u2026')?.out).toBe('等等……')
  })

  it('decodes HTML entities for matching only', () => {
    expect(lookup(m, 'You can&#39;t see the kobold.')?.out).toBe('你看不到狗头人。')
  })
})

describe('item names', () => {
  it('keeps the hotkey prefix and builds a Chinese name', () => {
    expect(translateItem(m, 'g - a potion of magic')).toBe('g - 魔法药水')
  })

  it('handles quantity, adjective and parentheticals', () => {
    expect(translateItem(m, 'd - 2 black potions')).toBe('d - 黑色药水×2')
    expect(translateItem(m, 'a +0 robe (worn)')).toBe('布袍（已穿戴）')
  })

  it('moves an "of X" suffix in front', () => {
    expect(translateItem(m, 'the +2 ring of protection')).toBe('防护的+2戒指')
  })

  it('gives up rather than guessing', () => {
    expect(translateItem(m, 'a weird contraption')).toBeNull()
  })
})

describe('dynamic titles', () => {
  it('translates gear slots without the category hint', () => {
    expect(matchTitle('Gear: 1/52 gear slots')).toBe('装备：1/52')
  })

  it('translates a casting line', () => {
    expect(matchTitle('Casting: Foxfire (safe; 4% risk of failure)')).toBe('施法：Foxfire（安全；失败率 4%）')
  })
})
