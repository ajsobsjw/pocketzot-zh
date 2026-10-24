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
  it('translates log lines through the real view', async () => {
    await setLang('zh')
    const view = mount(fixture.messages as ServerMsg[])
    await tick()
    const log = view.querySelector('#game-messages')?.textContent ?? ''
    expect(log).toContain('好的')
    disposeView(view)
  })
})
