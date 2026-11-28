// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeStorage } from '../test/fake-storage'

vi.stubGlobal('localStorage', fakeStorage())

import { isChangelogUnread, openAboutDoc, openChangelogDoc, openGesturesDoc } from './docs'
import { getPref } from '../prefs'
import { setLang } from '../i18n'

beforeEach(() => {
  localStorage.clear()
})

afterEach(async () => {
  for (const close of document.querySelectorAll<HTMLButtonElement>('.doc-close')) close.click()
  document.body.innerHTML = ''
  await setLang('en')
})

it('shows Chinese documentation and can switch an open document back to English', async () => {
  await setLang('zh')
  openAboutDoc()
  expect(document.querySelector('.doc-title')?.textContent).toBe('关于')
  expect(document.querySelector('.doc-body')?.textContent).toContain('添加到主屏幕')
  expect(document.querySelector('.doc-body a[href="/source.zip"]')?.textContent).toContain('完整对应源码')
  await setLang('en')
  expect(document.querySelector('.doc-title')?.textContent).toBe('About')
  expect(document.querySelector('.doc-body')?.textContent).toContain('Add to Home Screen')
})

it('renders the hand-translated gesture guide and every current changelog date in Chinese', async () => {
  openChangelogDoc()
  const dates = [...document.querySelectorAll('.doc-body h2')].map((heading) => heading.textContent)
  await setLang('zh')
  const entries = [...document.querySelectorAll('.doc-body li')]
  expect(entries.length).toBeGreaterThan(50)
  for (const entry of entries) expect(entry.textContent).toMatch(/[\u3400-\u9fff]/)
  expect([...document.querySelectorAll('.doc-body h2')].map((heading) => heading.textContent)).toEqual(dates)
  openGesturesDoc()
  expect([...document.querySelectorAll('.doc-body')].at(-1)?.textContent).toContain('双指长按地图')
})

describe('changelog unread state', () => {
  // A fresh install (no stored pref) is unread on purpose: the first launch
  // after install surfaces the release notes. This also guards the date
  // parsing itself — if CHANGELOG.md's `## YYYY-MM-DD` heading format ever
  // drifts, newestChangelogDate comes back null and this fails.
  it('is unread with no stored pref', () => {
    expect(isChangelogUnread()).toBe(true)
  })

  it('opening the doc marks the newest entry seen', () => {
    openChangelogDoc()
    expect(isChangelogUnread()).toBe(false)
    expect(getPref('changelogSeen')).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('goes unread again when a newer entry ships', () => {
    openChangelogDoc()
    document.body.innerHTML = ''
    // Simulate a stale pref from a previous deploy's changelog.
    localStorage.setItem(
      'pocketzot:prefs',
      JSON.stringify({ changelogSeen: '2001-01-01' }),
    )
    expect(isChangelogUnread()).toBe(true)
  })
})
