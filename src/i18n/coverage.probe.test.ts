// @vitest-environment happy-dom

// Coverage probe over the captured server traffic in src/golden. It is a
// measurement, not a golden: the log line prints per-category hit rates so a
// change to the matcher shows its effect on real strings. The loose floors only
// guard against a regression that switches translation off entirely.
import { afterAll, describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { setLang, t, tItem, tTitle } from './index'

const DIR = 'src/golden'

interface Buckets { [kind: string]: { hit: number; miss: number; misses: string[] } }

function collect(): Map<string, string> {
  const texts = new Map<string, string>()
  const push = (s: unknown, kind: string) => {
    if (typeof s !== 'string' || !s.trim()) return
    if (!/[A-Za-z]/.test(s)) return
    if (!texts.has(s)) texts.set(s, kind)
  }
  for (const f of readdirSync(DIR).filter((n) => n.endsWith('.golden.json'))) {
    const j = JSON.parse(readFileSync(join(DIR, f), 'utf8')) as { messages?: any[] }
    for (const m of j.messages ?? []) {
      if (m.msg === 'msgs') for (const x of m.messages ?? []) push(x.text, 'msgs')
      if (m.msg === 'menu') {
        push(m.title?.text, 'menu-title')
        push(m.more, 'menu-more')
        for (const it of m.items ?? []) push(it.text, 'menu-item')
      }
      if (m.msg === 'ui-push') {
        push(m.title, 'ui-push-title')
        if (String(m.type ?? '').startsWith('describe')) push(m.body, 'ui-push-body')
      }
    }
  }
  return texts
}

afterAll(async () => {
  await setLang('en')
})

describe('coverage on captured traffic', () => {
  it('reports per-category hit rates', async () => {
    await setLang('zh')
    const texts = collect()
    const out: Buckets = {}
    for (const [text, kind] of texts) {
      const b = (out[kind] ??= { hit: 0, miss: 0, misses: [] })
      const plain = text.replace(/<[^>]*>/g, '').trim()
      const shown = kind.startsWith('menu') ? tItem(plain) : kind === 'ui-push-body' ? plain : tTitle(plain)
      if (shown !== plain) b.hit++
      else {
        b.miss++
        if (b.misses.length < 2) b.misses.push(plain.slice(0, 50))
      }
    }
    const lines: string[] = []
    let hit = 0
    let all = 0
    for (const [kind, b] of Object.entries(out).sort()) {
      hit += b.hit
      all += b.hit + b.miss
      lines.push(`${kind.padEnd(15)} ${b.hit}/${b.hit + b.miss}  ${b.misses.map((m) => `"${m}"`).join(' ')}`)
    }
    console.log(`\ncoverage: ${hit}/${all} (${((hit / all) * 100).toFixed(0)}%)\n${lines.join('\n')}`)

    // Messages are the volume case; the captured frames are mostly menus and
    // prompt rows, so the floor is deliberately low.
    expect(hit).toBeGreaterThan(0)
  })
})
