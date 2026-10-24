// @vitest-environment happy-dom

// The DOM pass: text nodes are translated after they are inserted, attributes
// (placeholder/aria-label/title) too, and the map grid is left alone. Switching
// back to English restores the originals.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { installAutoTranslate } from './dom'
import { setLang } from './index'

const tick = () => new Promise((r) => setTimeout(r, 40))

let dispose: () => void
let root: HTMLElement

beforeAll(async () => {
  await setLang('zh')
  root = document.createElement('div')
  document.body.appendChild(root)
  dispose = installAutoTranslate(root)
})

afterAll(() => {
  dispose()
  root.remove()
  void setLang('en')
})

describe('auto translate', () => {
  it('translates a rendered text node', async () => {
    const p = document.createElement('p')
    p.textContent = 'Spells'
    root.appendChild(p)
    await tick()
    expect(p.textContent).toBe('法术')
  })

  it('translates a label attribute', async () => {
    const input = document.createElement('input')
    input.setAttribute('placeholder', 'Play offline')
    root.appendChild(input)
    await tick()
    expect(input.getAttribute('placeholder')).toBe('离线游戏')
  })

  it('skips the map grid', async () => {
    const grid = document.createElement('div')
    grid.id = 'map-grid'
    grid.textContent = 'Spells'
    root.appendChild(grid)
    await tick()
    expect(grid.textContent).toBe('Spells')
  })

  it('restores English on switch back', async () => {
    const p = document.createElement('p')
    p.textContent = 'Skills'
    root.appendChild(p)
    await tick()
    expect(p.textContent).toBe('技能')
    await setLang('en')
    await tick()
    expect(p.textContent).toBe('Skills')
  })
})
