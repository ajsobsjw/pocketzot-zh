// @vitest-environment happy-dom
import { afterAll, expect, it } from 'vitest'
import { setLang } from './index'
import { translatePage, translateScrollerMarkup, translateTerminalLine } from './pages'
import { translateGameOver } from './game-over'
import { dcssToHtml } from '../game/dcss-colors'
import help from '../golden/07-lookup-input-dialog.golden.json'
import travel from '../golden/12-travel-prompt-help.golden.json'
import quit from '../golden/20-quit-game-over.golden.json'

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

it('keeps the literal upstairs and downstairs keys in the rendered Chinese travel help', async () => {
  await setLang('zh')
  const raw = travel.messages.find((message) => message.type === 'formatted-scroller')!.text!
  const el = document.createElement('div')
  el.innerHTML = dcssToHtml(translateScrollerMarkup(raw))
  expect(el.textContent).toMatch(/<\s*: 从最近的楼梯上楼。/)
  expect(el.textContent).toMatch(/>\s*: 从最近的楼梯下楼。/)
})

it('localizes the quickstart without translating an unrelated page with similar prose', async () => {
  await setLang('zh')
  const intro = 'So, you want to start playing Crawl straight away without bothering with the\nmanual? Read this, the guide to starting Crawl with a minimum of preparation.'
  const raw = `Crawl Quick-Start Guide\n=======================\n\n${intro}\n\nHappy Crawling!`
  const translated = translateScrollerMarkup(raw)
  expect(translated.split('\n')).toHaveLength(raw.split('\n').length)
  expect(translated.replaceAll('\n', '')).toContain('想跳过手册，直接开始游玩吗？')
  expect(translated).toContain('祝你探索愉快！')
  expect(translateScrollerMarkup(intro)).toBe(intro)
})

it('translates the captured quit scorecard without changing names or scores', async () => {
  const raw = quit.messages.find((message) => message.type === 'game-over')!.body!
  await setLang('zh')
  const translated = translateGameOver(raw)
  expect(translated).toMatch(/7 Synthplayer [^\n]+（2级，生命 19\/19）/)
  expect(translated).toMatch(/于2026年7月31日以[^\n]*[\u3400-\u9fff]开始冒险。/)
  expect(translated).toContain('于2026年9月28日')
  expect(translated).toContain('第1层放弃了游戏。')
  expect(translated).toContain('用时 00:13:58（447 回合）。')
  expect(translated).toContain('1.   900000 Synthone   HuFi-27 携佐特之球逃离')
  expect(translated.split('\n')).toHaveLength(raw.split('\n').length)
  await setLang('en')
  expect(translateGameOver(raw)).toBe(raw)
})

it('translates standalone spell noise metadata and concatenated combat history rows', async () => {
  await setLang('zh')
  const history = [
    '(Noise: Extremely) Loud',
    'Nothing appears to happen. The rat is staggered.',
    'You stop stampeding. You kill the goblin.',
  ].join('\n')
  const out = translatePage(history)
  expect(out).toContain('噪音：极响')
  expect(out).toContain('似乎什么都没发生。')
  expect(out).toContain('地精')
  expect(out.split('\n')).toHaveLength(history.split('\n').length)
})

it('is reversible by rerendering original English', async () => {
  await setLang('en')
  expect(translatePage('Dungeon Crawl Help')).toBe('Dungeon Crawl Help')
})

it('translates combined encounter and pickup history without swallowing later events', async () => {
  const raw = 'You encounter a hobgoblin. You kill the hobgoblin!\nYou see here a ball python corpse. Magic restored.'
  await setLang('zh')
  expect(translatePage(raw)).toBe('你遭遇了大地精。你杀死了大地精！\n你在这里看到球蟒尸体。魔力已恢复。')
  await setLang('en')
  expect(translatePage(raw)).toBe(raw)
})
