// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, it } from 'vitest'
import { LayoutView } from '../views/layout-view'
import type { UiPushMsg } from '../views/game-overlays'
import { translateCharOverview } from './char-overview'
import data from './data/zh-mutations.json'
import { setLang } from './index'
import { localizeMutationDetail, translateMutationName, translateMutationMenuFooter, translateMutationRow } from './mutations'

beforeEach(() => setLang('zh'))
afterEach(() => setLang('en'))

it('covers the audited Crawl 0.35-a0 titles, prose, and per-level rows', () => {
  const values: Record<string, string> = {
    'protean grace': '+4 EV and Slay +4 from this mutation.', trickster: '16', mnemnophage: '5',
    'mark of carnage': 'cold or ice', 'mark of annihilation': 'fire or lava',
  }
  expect(Object.values(data.names).filter(name => !/\p{Script=Han}/u.test(translateMutationName(name)))).toEqual([])
  const untranslated = Object.entries(data.descriptions).filter(([name, [en]]) => {
    const source = en.replace('%value%', values[name] ?? '').replace('%key%', '<w>[a]</w>')
    const rendered = localizeMutationDetail(name, source)
    return !rendered || !/\p{Script=Han}/u.test(rendered.body) || rendered.body.includes('%1')
  }).map(([name]) => name)
  expect(untranslated).toEqual([])
  expect(Object.keys(data.shortRows).filter(row => !/\p{Script=Han}/u.test(translateMutationRow(row)))).toEqual([])
})

it('preserves colour, wrappers, hotkeys, stats and future levels in mutation menus', () => {
  expect(translateMutationRow('a - <magenta>[<darkgrey>(Your skin changes colour to match your surroundings (Stealth+).)</darkgrey>]</magenta>'))
    .toBe('a - <magenta>[<darkgrey>(你的皮肤会变色以匹配环境。（潜行+）)</darkgrey>]</magenta>')
  expect(translateMutationRow('b - <darkgrey>[Your tail will grow strong enough to constrict your foes.]</darkgrey> XL 13'))
    .toBe('b - <darkgrey>[你的尾巴将变得足够强壮，能够缠住敌人。]</darkgrey> 等级 13')
  expect(translateMutationRow('c - <lightblue>A meltable icy envelope protects you from harm. (AC +7)</lightblue>'))
    .toContain('（防御+7）</lightblue>')
  expect(translateMutationMenuFooter('<darkgrey>()</darkgrey>: Suppressed.\n<magenta>[]</magenta>: Transient mutations.'))
    .toBe('<darkgrey>()</darkgrey>：已压制。\n<magenta>[]</magenta>：临时变异。')
})

it('translates fallback descriptions and preserves category colours and auxiliary attack values', () => {
  const body = 'Your skin changes colour to match your surroundings (Stealth+).\nTrigger chance:  33%\nBase damage:     7\n\n      Category: [<red>Anatomy</red>, <darkgrey>Blood</darkgrey>, <darkgrey>Bones</darkgrey>, <red>Hands</red>]'
  expect(localizeMutationDetail('Camouflage', body)?.body).toBe(
    '你的皮肤会变色以匹配环境。（潜行+）\n触发几率：33%\n基础伤害：7\n\n类别：［<red>解剖结构</red>、<darkgrey>血液</darkgrey>、<darkgrey>骨骼</darkgrey>、<red>双手</red>］',
  )
  expect(localizeMutationDetail('Spit poison', 'You can spit poison with <w>[A]</w>. The second level of this mutation intensifies the poison from a single glob into a large cloud.')?.body)
    .toContain('<w>[A]</w>')
  expect(localizeMutationDetail('Flight', 'This is not a mutation description.')).toBeNull()
})

it('rerenders the genuine describe-generic payload on language changes without changing it', async () => {
  const body = 'Your skin changes colour to match your surroundings. Each level of this mutation provides Stealth+.\n\n                                  Category: [<darkgrey>Substance</darkgrey>]'
  const message: UiPushMsg = Object.freeze({ type: 'describe-generic', title: 'Camouflage (level 1/3)', body })
  const overlay = document.createElement('div')
  let title = ''
  const lv = new LayoutView({
    content: () => overlay, renderOverlay: (heading, build) => { title = heading; overlay.innerHTML = ''; build() },
    send: () => {}, focusView: () => {}, guardedFocus: () => {}, loader: () => null,
    topLayout: () => message, spectating: false, repaint: () => {}, showTextPage: () => {}, visible: () => true,
  })
  try {
    lv.show(message)
    expect(title).toBe('伪装（等级 1/3）')
    expect(overlay.textContent).toContain('潜行')
    expect(overlay.textContent).toContain('类别：［物质］')
    expect(overlay.querySelector('span[style*="#555753"]')?.textContent).toBe('物质')
    expect(translateCharOverview('<w>A:</w> <darkgrey>(Camouflage 1)</darkgrey>')).toContain('(伪装 1)')
    await setLang('en')
    expect(title).toBe(message.title)
    expect(overlay.textContent).toContain('Each level of this mutation provides Stealth+.')
    expect(message.body).toBe(body)
  } finally {
    lv.dispose()
  }
})
