// Dump human-readable UI literals from the views so they can be translated by
// hand into src/i18n/ui-zh.ts. Dev tool, not shipped.
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = 'src'
const files = []
const walk = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) walk(p)
    else if (p.endsWith('.ts')) files.push(p)
  }
}
walk(ROOT)
files.splice(0, files.length, ...files.filter((f) => !f.includes('.test.') && !f.includes('i18n')))

const strings = new Map()
const add = (s) => {
  const t = s.trim()
  if (t.length < 3 || t.length > 200) return
  if (!/[A-Za-z]/.test(t)) return
  if (!/\s|[.?!:]$/.test(t)) return
  if (/^[a-z-]+(-[a-z]+)+$/.test(t)) return            // css tokens
  if (/^(https?:|\/|\.\/|data:|wss?:)/.test(t)) return
  if (/[{}<>=;]/.test(t) && !/[ ]/.test(t)) return
  if (!strings.has(t)) strings.set(t, 1)
  else strings.set(t, strings.get(t) + 1)
}

for (const f of files) {
  const text = readFileSync(f, 'utf8')
  // literals in quotes
  for (const m of text.matchAll(/(['"`])([^'"`\n]{3,200})\1/g)) add(m[2])
  // text directly between tags inside template literals
  for (const m of text.matchAll(/>\s*([A-Z][^<>{}\n]{2,120}?)\s*</g)) add(m[1])
  // attribute labels
  for (const m of text.matchAll(/(?:placeholder|aria-label|title)="([^"]{3,120})"/g)) add(m[1])
}

const out = [...strings.keys()].sort()
process.stdout.write(out.join('\n'))
console.error(`\n${out.length} strings`)
