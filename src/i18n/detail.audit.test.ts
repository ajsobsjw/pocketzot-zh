// @vitest-environment happy-dom
import { afterAll, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { setLang, t, tItem, tMore, tTitle } from './index'
import { loadDescript, zhDescribe } from './describe'
import { translateBody } from './body'
import { translateScrollerMarkup } from './pages'
import { translateGameOver } from './game-over'
import { dcssToHtml } from '../game/dcss-colors'
import { columnTable, menuColumns } from '../views/menu-columns'
import { translateMonsterBody, translateMonsterQuote, translateMonsterStatus } from './monster'

afterAll(() => setLang('en'))

it('audits captured display fragments instead of counting a changed page as a hit', async () => {
  await setLang('zh')
  await loadDescript()
  const buckets = new Map<string, { total: number; misses: Map<string, number> }>()
  const audit = (kind: string, original: string, shown: string) => {
    const source = original.replace(/<[^>]*>/g, '').trim()
    const output = shown.replace(/<[^>]*>/g, '').replace(/「[^」]*」/g, '').trim()
    if (!/[A-Za-z]{3}/.test(source) || /^SPELLSET_PLACEHOLDER$/.test(source)) return
    // Search prefixes and free-form player input are parser-facing syntax.
    if (/^(?:Stash search prefixes|Menu\/colouring prefixes):/.test(source)) return
    if (/^Search for what \[Enter for /.test(source) && output.startsWith('搜索什么')) return
    const bucket = buckets.get(kind) ?? { total: 0, misses: new Map<string, number>() }
    bucket.total++
    if (output === source || /\b(?:You|Your|This|The|It|would|damage|spell|armour|weapon)\b/i.test(output))
      bucket.misses.set(source, (bucket.misses.get(source) ?? 0) + 1)
    buckets.set(kind, bucket)
  }
  for (const file of readdirSync('src/golden').filter((name) => name.endsWith('.golden.json'))) {
    const fixture = JSON.parse(readFileSync(join('src/golden', file), 'utf8')) as { messages?: any[] }
    for (const msg of fixture.messages ?? []) {
      if (msg.msg === 'msgs') for (const row of msg.messages ?? []) {
        const plain = row.text?.replace(/<[^>]*>/g, '') ?? ''
        audit('log', plain, t(plain))
      }
      if (msg.msg === 'menu') {
        if (msg.title?.text) audit('menu-title', msg.title.text, tTitle(msg.title.text))
        if (msg.more) audit('menu-more', msg.more, tMore(msg.more))
        const cols = menuColumns(msg.tag, msg.title?.text)
        const rows = cols && columnTable(cols, msg.items ?? [])?.rows
        for (const item of msg.items ?? []) audit('menu-item', item.text, rows?.get(item.text) ?? tItem(item.text))
      }
      if (msg.msg !== 'ui-push') continue
      if (msg.title) audit('detail-title', msg.title, tTitle(msg.title))
      if (String(msg.type).startsWith('describe') && msg.body) {
        const replaced = zhDescribe(msg.title ?? '', msg.body, msg.type) ?? msg.body
        const translated = msg.type === 'describe-monster' ? translateMonsterBody(replaced) : translateBody(replaced)
        const sourceBlocks: string[] = msg.body.split(/\n[ \t]*\n/)
        const outputBlocks = translated.split(/\n[ \t]*\n/)
        for (let i = 0; i < sourceBlocks.length; i++) {
          const sourceLines = sourceBlocks[i].split('\n')
          const outputLines = (outputBlocks[i] ?? '').split('\n')
          if (sourceLines.length === outputLines.length)
            sourceLines.forEach((line, n) => audit(`${msg.type}-line`, line, outputLines[n]))
          else audit(`${msg.type}-block`, sourceBlocks[i], outputBlocks[i] ?? '')
        }
        if (msg.type === 'describe-monster' && msg.status) audit('monster-status', msg.status, translateMonsterStatus(msg.status))
        if (msg.type === 'describe-monster' && msg.quote) audit('monster-quote', msg.quote, translateMonsterQuote(msg.quote))
      } else if (msg.type === 'formatted-scroller' && msg.text) {
        const el = document.createElement('div')
        el.innerHTML = dcssToHtml(msg.text)
        const sources = el.textContent.split('\n')
        el.innerHTML = dcssToHtml(translateScrollerMarkup(msg.text))
        const outputs = el.textContent.split('\n')
        sources.forEach((line, i) => audit('help-line', line, outputs[i] ?? ''))
      } else if (msg.type === 'game-over' && msg.body) {
        const sources: string[] = msg.body.split('\n')
        const outputs = translateGameOver(msg.body).split('\n')
        sources.forEach((line, i) => audit('scorecard-line', line, outputs[i] ?? ''))
      }
    }
  }
  for (const [kind, { total, misses }] of buckets) {
    console.log(`${kind}: ${total - [...misses.values()].reduce((a, b) => a + b, 0)}/${total}`)
    for (const [text, count] of [...misses].sort((a, b) => b[1] - a[1]).slice(0, 25))
      console.log(`  ${count} ${text.slice(0, 180)}`)
  }
  expect([...buckets].filter(([kind]) => kind.startsWith('describe-')).reduce((sum, [, bucket]) => sum + bucket.total, 0)).toBeGreaterThan(20)
  expect(buckets.get('help-line')?.total).toBeGreaterThan(10)
  expect(buckets.get('scorecard-line')?.misses.size).toBe(0)
})
