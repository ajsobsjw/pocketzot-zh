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

  it('honours explicit no-translation markers and surrounding whitespace', async () => {
    const privateText = document.createElement('div')
    privateText.dataset.noI18n = ''
    privateText.textContent = 'Spells'
    const label = document.createElement('span')
    label.textContent = '  Spells  '
    root.append(privateText, label)
    await tick()
    expect(privateText.textContent).toBe('Spells')
    expect(label.textContent).toBe('  法术  ')
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

  it('restores the latest live label and attributes without undoing external edits', async () => {
    await setLang('zh')
    const button = document.createElement('button')
    const text = document.createTextNode('Downloading tiles 1/3…')
    button.append(text)
    button.title = 'Show all versions (3)'
    button.setAttribute('aria-label', 'Options file')
    root.appendChild(button)
    await tick()
    expect(text.data).toBe('正在下载图块 1/3…')
    expect(button.title).toBe('显示所有版本（3）')
    text.data = 'Downloading tiles 2/3…'
    button.title = 'Register on C$&O'
    await tick()
    expect(text.data).toBe('正在下载图块 2/3…')
    expect(button.title).toBe('在 C$&O 注册')
    button.removeAttribute('aria-label')
    await setLang('en')
    expect(text.data).toBe('Downloading tiles 2/3…')
    expect(button.title).toBe('Register on C$&O')
    expect(button.getAttribute('aria-label')).toBeNull()
  })
})
