// @vitest-environment happy-dom
import { afterAll, expect, it } from 'vitest'
import { setLang } from './index'
import { translatePage, translateTerminalLine } from './pages'
import help from '../golden/07-lookup-input-dialog.golden.json'
import travel from '../golden/12-travel-prompt-help.golden.json'

afterAll(() => setLang('en'))

it('translates the full captured help index and travel help', async () => {
  await setLang('zh')
  for (const fixture of [help, travel]) {
    for (const message of fixture.messages as Array<{ msg: string; type?: string; text?: string }>) {
      if (message.msg !== 'ui-push' || message.type !== 'formatted-scroller') continue
      const plain = message.text!.replace(/<[^>]*>/g, '')
      const out = translatePage(plain)
      expect(out.split('\n')).toHaveLength(plain.split('\n').length)
      // Only actual hotkeys may remain Latin, not untranslated help sentences.
      expect(out).not.toMatch(/[A-Za-z]{5,}/)
    }
  }
})

it('retains parser-facing search keywords and player input', async () => {
  await setLang('zh')
  expect(translatePage('Stash search prefixes: weapon ego holy wrath'))
    .toContain('weapon ego holy wrath')
  expect(translateTerminalLine('a - Minotaur')).toContain('牛头人')
})

it('is reversible by rerendering original English', async () => {
  await setLang('en')
  expect(translatePage('Dungeon Crawl Help')).toBe('Dungeon Crawl Help')
})
