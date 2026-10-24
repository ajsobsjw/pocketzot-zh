#!/usr/bin/env node
// Build src/i18n/data/zh.json from a localized DCSS install.
//
//   node tools/build-zh-dict.mjs --src "<path to your localized DCSS install>/dat"
//
// The source is dat/i18n/<lang>/source.txt: "%%%%"-separated blocks of
//    <engine string>
//    [blank]
//    <translation>
// Engine strings are pre-format templates ("You hit %s."), which is exactly
// what a client-side layer needs: match the formatted line, put the captured
// names back into the translated template.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const args = process.argv.slice(2)
const getArg = (name, fallback) => {
  const i = args.indexOf(name)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}
const DCS_DAT = getArg('--src', process.env.DCS_DAT)
if (!DCS_DAT) {
  console.error('usage: node tools/build-zh-dict.mjs --src "<localized DCSS install>/dat"')
  process.exit(1)
}
const LANG = getArg('--lang', 'zh')
const OUT = resolve(getArg('--out', 'src/i18n/data/zh.json'))

const file = resolve(DCS_DAT, 'i18n', LANG, 'source.txt')
const raw = readFileSync(file, 'utf8')
const lines = raw.split(/\r?\n/)

/** Parse "%%%%" blocks: first line = source, last non-empty line = translation. */
export function parseSourceTxt(text) {
  const out = new Map()
  let block = []
  const flush = () => {
    if (block.length) {
      const src = block[0]
      const dsts = block.slice(1).filter((s) => s.trim() !== '')
      if (src && dsts.length) out.set(src, dsts[dsts.length - 1])
    }
    block = []
  }
  for (const line of text.split(/\r?\n/)) {
    if (line.trimEnd() === '%%%%') flush()
    else block.push(line)
  }
  flush()
  return out
}

const map = parseSourceTxt(raw)

// Placeholder-bearing keys and literal keys are split at load time by the
// runtime (it only needs one object). Keep insertion order so the file is
// reproducible.
const dict = Object.create(null)
for (const [k, v] of map) dict[k] = v

const json = {
  v: 1,
  source: `dcss-${LANG}-source.txt`,
  generated: new Date().toISOString().slice(0, 10),
  entries: dict,
}

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify(json))

const bytes = JSON.stringify(json).length
console.log(`wrote ${OUT}`)
console.log(`entries=${map.size} bytes=${(bytes / 1024).toFixed(0)} KB lines=${lines.length} from=${file}`)
