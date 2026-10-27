// @vitest-environment happy-dom
import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { setLang } from './index'
import { translateBody } from './body'
import { translateEgoProse } from './egos'

beforeAll(() => setLang('zh'))
afterAll(() => setLang('en'))

const entries = readFileSync('src/i18n/data/egos-en.txt', 'utf8')
  .split('%%%%').map((s) => s.trim()).filter(Boolean)

for (const entry of entries) {
  const [name, ...lines] = entry.split('\n')
  const prose = lines.join('\n').replace(/\{\{[\s\S]*?\}\}/g, '').trim()
  it(`translates the upstream explanation: ${name}`, () => {
    expect(translateEgoProse(prose)).toMatch(/[\u4e00-\u9fff]/)
    const label = name.split(' (')[0]
    const wrapped = prose.replace(/\n/g, '\n             ')
    const shown = translateBody(`<white>${label}:    <lightgrey>${wrapped}`)
    expect(shown).not.toContain('It ')
    expect(shown).not.toContain('The chance')
  })
}

it('handles the screenshot row, internal markup and conditional pain explanations', () => {
  expect(translateBody('Venom:     It poisons victims.')).toBe('淬毒：它使目标中毒。')
  expect(translateBody('<white>Venom:<lightgrey>     It <green>poisons</green> victims.'))
    .toBe('淬毒：它使目标中毒。')
  const base = 'It inflicts extra damage on living creatures proportional to your Necromancy skill.'
  const trog = ' Trog prevents you from unleashing this effect.'
  const unable = ' Your inability to study Necromancy prevents you from drawing on the full power of this weapon.'
  for (const suffix of ['', trog, unable, trog + unable]) {
    expect(translateBody('Pain:  ' + base + suffix)).not.toMatch(/inflicts|Trog|inability/)
  }
})

it('translates weapon category prose and formula abbreviations without altering search terms', () => {
  expect(translateBody('This weapon falls into the ’Short Blades’ category. It is extremely good for stabbing helpless or unaware enemies. It is a one-handed weapon.'))
    .not.toMatch(/weapon|stabbing|handed/)
  expect(translateBody('+ 3 (Ench)')).toBe('+ 3 (附魔)')
  expect(translateBody('You took it off a goblin on level 2 of the Dungeon.')).not.toMatch(/goblin|Dungeon/)
  expect(translateBody('Stash search prefixes: weapon ego venom')).toContain('weapon ego venom')
  expect(translateBody('Unknown:  It does something new.')).toContain('It does something new.')
})
