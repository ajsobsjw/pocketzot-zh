// @vitest-environment happy-dom
import { afterAll, expect, it } from 'vitest'
import { writeFileSync } from 'node:fs'
import data from './data/zh-descript.json'
import { setLang, tItem } from './index'

afterAll(() => setLang('en'))

it('audits names against the bundled description catalogue', async () => {
  await setLang('zh')
  const misses: Record<string, string[]> = {}
  for (const category of ['monsters', 'items', 'spells', 'ability', 'species', 'backgrounds', 'skills'] as const) {
    const names = Object.keys(data[category]).map((s) => s.replace(/ spell$/, ''))
    misses[category] = names.filter((s) => tItem(s) === s)
  }
  if (process.env.I18N_NAMES_OUT) writeFileSync(process.env.I18N_NAMES_OUT, JSON.stringify(misses, null, 2))
  expect(misses).toEqual({ monsters: [], items: [], spells: [], ability: [], species: [], backgrounds: [], skills: [] })
  expect(tItem('dagger')).toBe('匕首')
})
