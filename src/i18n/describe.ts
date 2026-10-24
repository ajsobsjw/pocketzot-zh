// Phase D (light): replace the English prose block of a describe overlay with
// the Chinese description from dat/descript/zh, keyed by the English name that
// the overlay title carries. Computed lines (base armour, enchantability…) are
// kept below the prose and translated by the normal label rules.

import { getLang, setProseLookup } from './index'

type DescDict = Record<string, Record<string, string>> & { pairs?: Record<string, string> }

let dict: DescDict | null = null
let loading: Promise<void> | null = null
let proseMap: Map<string, string> | null = null
const norm = (s: string): string => s.replace(/\s+/g, ' ').trim()

const ORDER = ['items', 'monsters', 'spells', 'gods', 'features', 'unrand', 'ability', 'status', 'species', 'backgrounds'] as const

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
      for (const [en, zh] of Object.entries(raw.pairs ?? {})) map.set(norm(en), zh)
      proseMap = map
      setProseLookup((text) => map.get(norm(text)) ?? null)
    })
  }
  return loading
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

function findProse(name: string): string | null {
  if (!dict) return null
  const candidates = [name, name.toLowerCase()]
  // The spell database keys carry a " spell" suffix ("Magic Dart spell").
  if (dict.spells) candidates.push(`${name} spell`, `${name.toLowerCase()} spell`)
  for (const kind of ORDER) {
    const table = dict[kind]
    if (!table) continue
    for (const cand of candidates) {
      const hit = table[cand]
      if (hit) return hit
    }
  }
  return null
}

/**
 * Returns the overlay body with its prose paragraph replaced, or null when the
 * feature has nothing to offer (unknown name, dict not loaded, English off).
 */
export function zhDescribe(title: string, body: string): string | null {
  if (getLang() !== 'zh' || !dict || !body) return null
  const paras = body.split(/\n[ \t]*\n/)
  const idx = paras.findIndex((p) => p.replace(/<[^>]*>/g, '').trim() !== '')
  if (idx < 0) return null
  const out = paras.slice()
  let changed = false
  let prose = title ? findProse(describeName(title)) : null
  // Pages without a usable title (describe-god carries the name only in the
  // body) still match by their opening paragraph, which is the database text.
  if (!prose && proseMap) {
    prose = proseMap.get(norm(paras[idx].replace(/<[^>]*>/g, ''))) ?? null
  }
  if (prose) {
    out[idx] = prose
    changed = true
  }
  // Every other paragraph that is a database quote (the Quote: section of a
  // monster/item page) also gets its localized twin.
  if (proseMap) {
    for (let i = 0; i < out.length; i++) {
      if (i === idx && prose) continue
      const plain = norm(out[i].replace(/<[^>]*>/g, ''))
      if (plain.length < 20) continue
      const pair = proseMap.get(plain)
      if (pair) {
        out[i] = pair
        changed = true
      }
    }
  }
  return changed ? out.join('\n\n') : null
}
