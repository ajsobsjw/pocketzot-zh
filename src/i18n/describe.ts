// Phase D (light): replace the English prose block of a describe overlay with
// the Chinese description from dat/descript/zh, keyed by the English name that
// the overlay title carries. Computed lines (base armour, enchantability…) are
// kept below the prose and translated by the normal label rules.

import { getLang, setProseLookup } from './index'
import { MANUAL_PROSE } from './manual-zh'

type DescDict = Record<string, Record<string, string>> & {
  pairs?: Record<string, string>
  monstatus?: Record<string, string>
}

let dict: DescDict | null = null
let loading: Promise<void> | null = null
let proseMap: Map<string, string> | null = null
const norm = (s: string): string => s.replace(/\s+/g, ' ').trim()

const ORDER = ['items', 'monsters', 'spells', 'gods', 'features', 'unrand', 'ability', 'status', 'species', 'backgrounds', 'skills'] as const

export function loadDescript(): Promise<void> {
  if (dict) return Promise.resolve()
  if (!loading) {
    loading = import('./data/zh-descript.json').then((mod) => {
      const raw = (mod.default ?? mod) as unknown as DescDict
      dict = raw
      // Whole-paragraph pairs (species/background blurbs shown verbatim on the
      // new-game screen). Whitespace is normalised on both sides because the
      // wire text is reflowed and the database keeps hard line breaks.
      const map = new Map<string, string>()
      // Status descriptions can carry colour markup (the engine resolves
      // "[[… monstatus]]" references before sending); keys are matched against
      // plain text, so drop tags on the key side only.
      for (const [en, zh] of Object.entries(raw.pairs ?? {})) {
        map.set(norm(en.replace(/<[^>]*>/g, '')), zh)
      }
      // Hand-written prose for content newer than the 0.34.1 Chinese database.
      for (const [en, zh] of Object.entries(MANUAL_PROSE)) map.set(norm(en), zh)
      proseMap = map
      setProseLookup((text) => map.get(norm(text)) ?? null)
    })
  }
  return loading
}

/** Whole-paragraph prose from dat/descript (quotes, species blurbs, …). */
export function lookupProse(text: string): string | null {
  if (!proseMap || !text) return null
  const plain = norm(text.replace(/<[^>]*>/g, ''))
  return plain ? proseMap.get(plain) ?? null : null
}

/** The localized "Tag: body" description from dat/descript/zh/monstatus.txt. */
export function lookupMonsterStatus(tag: string): string | null {
  const table = dict?.monstatus
  if (!table || !tag) return null
  const key = tag.trim().toLowerCase()
  return table[key] ?? table[tag.trim()] ?? null
}

/** Strip the hotkey, article, enchantment and qualifiers from an overlay title. */
export function describeName(title: string): string {
  let s = title.replace(/<[^>]*>/g, '').trim()
  s = s.replace(/^\s*(?:\([^)]\)|[A-Za-z0-9*!?])\s+[-+#$]\s+/, '')
  s = s.replace(/\{[^}]*\}/g, '')          // artefact property braces
  s = s.replace(/\.\s*$/, '')
  s = s.replace(/\s*\([^)]*\)\s*$/, '')
  s = s.replace(/^(?:a|an|the)\s+/i, '')
  s = s.replace(/^[+-]\d+\s+/, '')
  return s.trim()
}

function findProse(name: string, kinds?: string[]): string | null {
  if (!dict) return null
  const candidates = [name, name.toLowerCase()]
  // The spell database keys carry a " spell" suffix ("Magic Dart spell").
  if (dict.spells) candidates.push(`${name} spell`, `${name.toLowerCase()} spell`)
  const order = kinds ? [...kinds, ...ORDER.filter((k) => !kinds.includes(k))] : ORDER
  for (const kind of order) {
    const table = dict[kind]
    if (!table) continue
    for (const cand of candidates) {
      const hit = table[cand]
      if (hit) return hit
    }
  }
  return null
}

// Which describe page type reads which database table first. Without this,
// "Foxfire" (a spell and a monster) resolves against monsters and the spell
// page shows the monster's prose.
const TYPE_KINDS: Record<string, string[]> = {
  'describe-spell': ['spells'],
  'describe-monster': ['monsters'],
  'describe-item': ['items', 'unrand'],
  'describe-god': ['gods'],
  'describe-feature': ['features'],
  'describe-skill': ['skills'],
}

/** Plain paragraph text, ignoring markup and the spellset slot marker. */
function plainOf(para: string): string {
  return norm(para.replace(/<[^>]*>/g, '').replace(/SPELLSET_PLACEHOLDER/g, ''))
}

export function zhDescribe(title: string, body: string, type?: string): string | null {
  if (getLang() !== 'zh' || !dict || !body) return null
  const paras = body.split(/\n[ \t]*\n/)
  const idx = paras.findIndex((p) => p.replace(/<[^>]*>/g, '').trim() !== '')
  if (idx < 0) return null
  const out = paras.slice()
  let changed = false
  const kinds = TYPE_KINDS[type ?? ''] ?? undefined
  let prose = title ? findProse(describeName(title), kinds) : null
  // Pages without a usable title (describe-god carries the name only in the
  // body) still match by their opening paragraph, which is the database text.
  if (!prose && proseMap) {
    prose = proseMap.get(plainOf(paras[idx])) ?? null
  }
  if (prose) {
    // Keep the spellset slot marker (it is replaced by the real list later).
    const slot = /<[^>]*>SPELLSET_PLACEHOLDER/.exec(paras[idx])?.[0] ?? ''
    out[idx] = prose + slot
    changed = true
  }
  // Every other paragraph that is a database quote (the Quote: section of a
  // monster/item page) also gets its localized twin.
  if (proseMap) {
    for (let i = 0; i < out.length; i++) {
      if (i === idx && prose) continue
      const plain = plainOf(out[i])
      if (plain.length < 20) continue
      const pair = proseMap.get(plain)
      if (pair) {
        const slot = /<[^>]*>SPELLSET_PLACEHOLDER/.exec(out[i])?.[0] ?? ''
        out[i] = pair + slot
        changed = true
      }
    }
  }
  return changed ? out.join('\n\n') : null
}
