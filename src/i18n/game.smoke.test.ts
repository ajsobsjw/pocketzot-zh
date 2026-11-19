// @vitest-environment happy-dom

// Game-view smoke in Chinese: a captured server frame goes through the real
// view, and the message log shows Chinese while the map grid keeps its ASCII
// glyphs untouched.
import { afterAll, describe, expect, it } from 'vitest'
import { buildGameView } from '../views/game-view'
import { disposeView } from '../views/view-dispose'
import type { GameConnection } from '../ws/connection'
import type { ClientMsg, ServerMsg } from '../ws/types'
import fixture from '../golden/12-travel-prompt-help.golden.json'
import { installAutoTranslate } from './dom'
import { setLang } from './index'

const disposeAuto = installAutoTranslate(document.body)
const tick = () => new Promise((r) => setTimeout(r, 60))

function mount(messages: ServerMsg[]) {
  const conn = {
    wsUrl: 'wss://test.example/socket',
    httpBase: 'https://test.example',
    onMessage: (() => {}) as (msg: ServerMsg) => void,
    onClose: () => {},
    onOpen: () => {},
    send: (_m: ClientMsg) => {},
    close: () => {},
  } as unknown as GameConnection
  const view = buildGameView({ conn, onLobby: () => {} })
  document.body.appendChild(view)
  for (const m of messages) conn.onMessage(m)
  return view
}

afterAll(async () => {
  disposeAuto()
  await setLang('en')
  document.body.innerHTML = ''
})

describe('game view in Chinese', () => {
  it('uses the same translations in live messages and the untagged Ctrl-P history', async () => {
    await setLang('en')
    const messages = [
      'The zap hits the hobgoblin.',
      'You kill the hobgoblin!',
      'You kill the kobold!',
      'You encounter a kobold. It is wielding a +0 dagger.',
      'You encounter a hobgoblin.',
      'The kobold is moderately wounded.',
      'The hobgoblin shouts!',
      'The hobgoblin is almost dead.',
      'The zap hits the hobgoblin but does no damage.',
      'Moving in this stuff is going to be slow.',
      'A nearby plant withers and dies.',
      'You now have 77 gold pieces (gained 7).',
      'You can’t see any susceptible monsters within range! (Use Z to cast anyway.)',
    ]
    const rawRows = messages.map((text, i) => (i === 0 || i === 8 ? ' ' : '_') + text)
    const historyText = rawRows.map((row) => `<lightgrey>${row[0]}<white>${row.slice(1)}`).join('\n')
    const unknown = 'An unfamiliar <red>blorptastic<white> event happens.'
    const view = mount([
      { msg: 'msgs', messages: messages.map(text => ({ text, channel: 0 })) },
      { msg: 'ui-push', type: 'formatted-scroller', tag: '', title: '', more: '', start_at_end: true,
        text: `${historyText}\n<lightgrey>_<white>${unknown}` },
    ] as ServerMsg[])
    const liveRows = () => Array.from(view.querySelectorAll('.msg-body'), row => row.textContent!).reverse()
    const historyRows = () => Array.from(view.querySelectorAll('.overlay-body .overlay-line'), row => row.textContent!)
    try {
      await setLang('zh')
      await tick()
      const live = liveRows()
      expect(live).toHaveLength(messages.length)
      expect(live[0]).toBe('电击击中了大地精。')
      expect(live[1]).toBe('你杀死了大地精！')
      expect(live[8]).toBe('电击击中了大地精，但没有造成伤害。')
      expect(live[11]).toBe('你现在有 77 枚金币（获得 7 枚）。')
      expect(live.join('\n').replace(/\bZ\b/g, '')).not.toMatch(/[A-Za-z]/)
      expect(historyRows()).toEqual([
        ...live.map((row, i) => rawRows[i][0] + row),
        '_An unfamiliar blorptastic event happens.',
      ])
      expect(view.querySelector('.overlay-body .overlay-line:nth-child(2)')?.innerHTML).toContain('color:')
      await setLang('en')
      expect(liveRows()).toEqual(messages)
      expect(historyRows()).toEqual([...rawRows, '_An unfamiliar blorptastic event happens.'])
    } finally {
      disposeView(view)
      await setLang('en')
    }
  })

  it('translates the reported encounter and brand lines at the rendering boundary', async () => {
    await setLang('zh')
    const view = mount([{
      msg: 'msgs', messages: [
        { text: '<red>You encounter Iiyb the Inquisitive. She is wielding a +5 dagger of holy wrath and carrying a wand of flame.', channel: 0 },
        { text: 'You can’t see any susceptible monsters within range! (Use Z to cast anyway.)', channel: 0 },
        { text: 'Iiyb zaps a wand.', channel: 0 },
      ],
    }] as ServerMsg[])
    await tick()
    const log = view.querySelector('#game-messages')?.textContent ?? ''
    expect(log).toContain('神圣之怒')
    expect(log).toContain('魔杖')
    expect(log).not.toMatch(/encounter|wielding|susceptible|zaps/)
    disposeView(view)
  })

  it('translates log lines through the real view', async () => {
    await setLang('zh')
    const view = mount(fixture.messages as ServerMsg[])
    await tick()
    const log = view.querySelector('#game-messages')?.textContent ?? ''
    expect(log).toContain('好的')
    disposeView(view)
  })
})
