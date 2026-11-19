// @vitest-environment happy-dom
import { afterAll, beforeAll, expect, it } from 'vitest'
import { translateBody } from './body'
import { setLang, t, tItem, tTitle } from './index'
import { translateMonsterBody } from './monster'

beforeAll(() => setLang('zh'))
afterAll(() => setLang('en'))

it('translates combatants, weapons and the no-damage suffix together', () => {
  const log = 'The kobold hits you with a +2 dagger, but does no damage. You puncture the kobold!'
  expect(t(log)).toBe('狗头人用+2匕首击中了你，但没有造成伤害。你刺穿了狗头人！')
  expect(t('You slice the kobold.')).toBe('你切割了狗头人。')
  const unknown = 'The kobold hits you with a flibbertigibbet.'
  expect(t(unknown)).toBe(unknown)
})

it('localizes the item type and property tokens without losing generated names or hotkeys', () => {
  const artefact = 'the +3 battleaxe of the Shallot {flame, rCorr Dex+3}'
  const title = tTitle(`The ${artefact.slice(4)}.`)
  expect(title).toContain('「the Shallot」 {烈焰, 腐蚀抗 敏捷+3}')
  expect(tItem(`b - [right here] ${artefact}`)).toBe(`b - [就在这里] ${title}`)
  expect(tItem('a - a +0 club; a stone')).toMatch(/^a - [^;]+；[^;]+$/)
  expect(translateBody('Base armour rating: 4       Evasion: -2')).toBe('基础护甲值：4       闪避：-2')
})

it('distinguishes alternate miscast effects from alternate damage types', () => {
  const spell = '<red>Miscasting this spell causes magic contamination and also either anchors you in place; poisons you; or deals up to 27 irresistible, fire or fragmentation damage.</red>'
  expect(translateBody(spell)).toBe('<red>施法失误会造成魔法污染，并可能将你定在原地，或使你中毒，或造成最多 27 点无法抵抗的或火焰或碎裂伤害。</red>')
  expect(translateBody(spell.replace('; poisons', ';\n  poisons'))).toBe(translateBody(spell))
  expect(translateBody('Miscasting this spell causes magic contamination and also slows you.')).toBe('施法失误会造成魔法污染，并额外使你减速。')
  const unknown = 'Miscasting this spell causes magic contamination and also deals up to 12 unknown damage.'
  expect(translateBody(unknown)).toBe(unknown)
  expect(tTitle('Your spells (describe)              Type                      Failure  Level')).toMatch(/学派\s+失败率\s+等级$/)
})

it('handles summon details with plural and named-monster pronouns', () => {
  expect(translateMonsterBody('This monster has been temporarily summoned to this location. Killing them yields no experience or items; they are incapable of using stairs.'))
    .toBe('此怪物是被临时召唤到这里的。击杀它们不会获得经验或物品；它们无法使用楼梯。')
  expect(translateMonsterBody('This monster has been created by magic and is temporary. If angered she will immediately vanish, yielding no experience or items.'))
    .toBe('此怪物由魔法创造，是临时的。若被激怒，她会立即消失，不提供经验或物品。')
})
