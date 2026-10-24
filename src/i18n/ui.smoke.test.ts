// @vitest-environment happy-dom

// End-to-end smoke: with Chinese on, opening the settings sheet yields Chinese
// headings — the UI dictionary plus the DOM pass, on the real component.
import { afterAll, describe, expect, it } from 'vitest'
import { openSettings } from '../views/settings-view'
import { installAutoTranslate } from './dom'
import { setLang } from './index'

const dispose = installAutoTranslate(document.body)
const tick = () => new Promise((r) => setTimeout(r, 60))

afterAll(async () => {
  dispose()
  await setLang('en')
  document.body.innerHTML = ''
})

describe('settings in Chinese', () => {
  it('renders translated section headers', async () => {
    await setLang('zh')
    openSettings()
    await tick()
    const headings = [...document.querySelectorAll('.settings-h')].map((h) => h.textContent)
    expect(headings).toContain('语言')
    expect(headings).toContain('控制方案')
  })

  it('keeps the language buttons apart and translates the segmented options', async () => {
    await setLang('zh')
    const labels = [...document.querySelectorAll('.settings-btn')].map((b) => b.textContent?.trim())
    // The engine dictionary maps "English" to 中文 (a language-menu context);
    // the UI table must win here, or both buttons read 中文.
    expect(labels).toContain('English')
    expect(labels).toContain('隐藏')
    expect(labels).toContain('折叠')
    expect(labels).toContain('展开')
  })
})
