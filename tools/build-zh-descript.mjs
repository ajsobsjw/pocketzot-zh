#!/usr/bin/env node
// Build src/i18n/data/zh-descript.json from the localized DCSS description
// databases (dat/descript/zh/*.txt). Keys stay the English database names —
// the overlay title is the only handle the client has — values are the Chinese
// prose.
//
//   node tools/build-zh-descript.mjs --src "<path to your localized DCSS install>/dat"
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const args = process.argv.slice(2)
const getArg = (name, fallback) => {
  const i = args.indexOf(name)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}
const DCS_DAT = getArg('--src', process.env.DCS_DAT)
if (!DCS_DAT) {
  console.error('usage: node tools/build-zh-descript.mjs --src "<localized DCSS install>/dat"')
  process.exit(1)
}
const LANG = getArg('--lang', 'zh')
const OUT = resolve(getArg('--out', 'src/i18n/data/zh-descript.json'))

const FILES = ['items', 'monsters', 'spells', 'gods', 'features', 'unrand', 'ability', 'status', 'species', 'backgrounds', 'skills']

// Whole-paragraph pairs (English prose → Chinese prose) for screens that show
// the database text verbatim, like the new-game species blurbs.
const PAIR_FILES = [
  'species', 'backgrounds', 'tutorial', 'gods', 'quotes',
  'items', 'monsters', 'spells', 'features', 'unrand', 'ability', 'status', 'skills',
]
const norm = (s) => s.replace(/\s+/g, ' ').trim()

function parse(path) {
  const text = readFileSync(path, 'utf8')
  const blocks = text.split(/^%%%%\s*$/m)
  const out = {}
  for (const block of blocks) {
    const lines = block.replace(/^\r?\n/, '').split(/\r?\n/)
    const name = (lines.shift() ?? '').trim()
    if (!name || name.startsWith('#') || name.startsWith('__')) continue
    // Source comments are not prose: they must not become dictionary keys or,
    // worse,译文本身 (the client would display "# TODO: …").
    const body = lines.filter((line) => !line.trim().startsWith('#')).join('\n').trim()
    if (!body) continue
    out[name] = body
  }
  return out
}

const dict = {}
let total = 0
for (const file of FILES) {
  const p = resolve(DCS_DAT, 'descript', LANG, `${file}.txt`)
  try {
    const entries = parse(p)
    dict[file] = entries
    total += Object.keys(entries).length
    console.log(`${file}: ${Object.keys(entries).length}`)
  } catch (e) {
    console.log(`${file}: skipped (${e.message})`)
  }
}

mkdirSync(dirname(OUT), { recursive: true })
const pairs = {}
for (const file of PAIR_FILES) {
  try {
    const en = parse(resolve(DCS_DAT, 'descript', `${file}.txt`))
    const zh = parse(resolve(DCS_DAT, 'descript', LANG, `${file}.txt`))
    let n = 0
    for (const [name, zhText] of Object.entries(zh)) {
      const enText = en[name]
      if (!enText) continue
      // The client replaces paragraph by paragraph (the engine splits the DB
      // text on blank lines), so multi-paragraph entries are paired per
      // paragraph. Equal paragraph counts are the common case; a mismatch
      // falls back to the whole text, which the client can still match if the
      // body arrived unbroken.
      const enParas = enText.split(/\n\s*\n/).map(norm).filter(Boolean)
      const zhParas = zhText.split(/\n\s*\n/).map(norm).filter(Boolean)
      if (enParas.length === zhParas.length && enParas.length > 0) {
        for (let i = 0; i < enParas.length; i++) {
          if (enParas[i] && zhParas[i]) pairs[enParas[i]] = zhParas[i]
        }
      }
      pairs[norm(enText)] = norm(zhText)
      n++
    }
    console.log(`pairs ${file}: ${n}`)
  } catch (e) {
    console.log(`pairs ${file}: skipped (${e.message})`)
  }
}
// God and monster speech: dat/database/*.txt, one line per utterance, keyed by
// a keyword block. The Chinese lines keep the speaker ("艾申扎利说：…").
function parseSpeech(path) {
  const text = readFileSync(path, 'utf8')
  const out = {}
  for (const block of text.split(/^%%%%\s*$/m)) {
    const lines = block.replace(/^\r?\n/, '').split(/\r?\n/)
    // Blocks can start with a comment banner ("##### Welcome messages"), so
    // the keyword is the first line that is neither blank nor a comment.
    while (lines.length && (!lines[0].trim() || lines[0].trim().startsWith('#'))) lines.shift()
    const key = (lines.shift() ?? '').trim()
    if (!key || key.startsWith('#')) continue
    out[key] = lines.map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
  }
  return out
}

for (const file of ['godspeak', 'monspeak']) {
  try {
    const en = parseSpeech(resolve(DCS_DAT, 'database', `${file}.txt`))
    const zh = parseSpeech(resolve(DCS_DAT, 'database', LANG, `${file}.txt`))
    let n = 0
    for (const [key, enLines] of Object.entries(en)) {
      const zhLines = zh[key]
      if (!zhLines) continue
      for (let i = 0; i < Math.min(enLines.length, zhLines.length); i++) {
        if (enLines[i] && zhLines[i]) {
          pairs[enLines[i]] = zhLines[i]
          n++
        }
      }
    }
    console.log(`speech ${file}: ${n}`)
  } catch (e) {
    console.log(`speech ${file}: skipped (${e.message})`)
  }
}

const json = { v: 1, source: `dcss-${LANG}-descript`, generated: new Date().toISOString().slice(0, 10), ...dict, pairs }
writeFileSync(OUT, JSON.stringify(json))
console.log(`wrote ${OUT}  entries=${total} pairs=${Object.keys(pairs).length}  ${(JSON.stringify(json).length / 1024).toFixed(0)} KB`)
