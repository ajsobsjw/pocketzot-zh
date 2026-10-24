// Core matcher for the DCSS zh dictionary.
//
// The dictionary keys are *pre-format* engine strings ("You hit %s."), so a
// formatted line ("You hit the kobold.") needs pattern matching, not a plain
// lookup. Everything here is display-only: callers keep the raw English string
// for parsing and use the return value for rendering. A miss always returns
// null, and callers fall back to the original text — a half-translated line is
// worse than an English one.

export type Dict = Map<string, string>

export interface Compiled {
  key: string
  tmpl: string
  re: RegExp
  anchor: string      // longest literal run; a candidate must contain it
  score: number       // literal length, for tie-breaking
  slots: number
}

export interface Matcher {
  exact: Dict
  /** templates bucketed by the first letter of their literal start */
  buckets: Map<string, Compiled[]>
  /** keys that are prefixes ending in ": " — "Base armour rating: " */
  labelPrefix: Compiled[]
  size: number
}

const PLACE_SRC = '%[-+ 0#]*\\d*(?:\\.\\d+)?[sdxc]'
const PLACE_KIND = new RegExp(PLACE_SRC.replace('[sdxc]', '([sdxc])'), 'g')
const HAS_PLACE = new RegExp(PLACE_SRC)

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Build a regex from an engine template, capturing each placeholder. */
function compile(key: string, tmpl: string): Compiled | null {
  const kinds: string[] = []
  let m: RegExpExecArray | null
  const km = new RegExp(PLACE_KIND.source, 'g')
  while ((m = km.exec(key))) kinds.push(m[1])
  if (kinds.length === 0) return null

  const parts = key.split(new RegExp(PLACE_SRC, 'g'))
  // Two placeholders back to back ("%s%s.") match almost anything. Only a
  // *middle* empty part means that; a leading/trailing %s ("%s comes into
  // view.") is a normal, very common shape.
  for (let i = 1; i < parts.length - 1; i++) if (parts[i] === '') return null

  let body = ''
  let score = 0
  let best = ''
  parts.forEach((part, i) => {
    body += escapeRe(part)
    score += part.replace(/\s+/g, ' ').trim().length
    const chunk = part.replace(/\s+/g, ' ').trim()
    if (chunk.length > best.length) best = chunk
    if (i < kinds.length) {
      const kind = kinds[i]
      if (kind === 'c') body += '(.)'
      else if (kind === 's') body += '([^\\n<>]{1,48}?)'  // names, adjectives
      else body += '(\\d+)'
    }
  })
  // A template with too little literal text anchors nothing ("%s of %s" is 3
  // literal characters) and would fire on half the message log. Six is enough
  // for the very common "Found %s." / "%s is nearby!" shapes.
  if (score < 5) return null
  if (best.length < 4) return null
  return { key, tmpl, re: new RegExp(`^${body}$`), anchor: best, score, slots: kinds.length }
}

/** First letter of a key, used as the match bucket ("0" for placeholder-led). */
function bucketOf(key: string): string {
  if (HAS_PLACE.test(key.slice(0, 4))) return '0'
  const m = /[A-Za-z]/.exec(key.slice(0, 24))
  return m ? m[0].toLowerCase() : '0'
}

export function compileDict(entries: Dict): Matcher {
  const buckets = new Map<string, Compiled[]>()
  const labelPrefix: Compiled[] = []
  let templates = 0
  for (const [key, tmpl] of entries) {
    if (HAS_PLACE.test(key)) {
      const c = compile(key, tmpl)
      if (c) {
        const b = bucketOf(key)
        const list = buckets.get(b)
        if (list) list.push(c)
        else buckets.set(b, [c])
        templates++
      }
      continue
    }
    // Label rows the engine prints as "label: " + value: the value is a number,
    // a short status, or a branch:depth pair ("Place: Dungeon:1").
    if (/:\s$/.test(key) && key.trim().length >= 6) {
      const anchor = key.trim()
      labelPrefix.push({
        key,
        tmpl,
        re: new RegExp(`^${escapeRe(key)}([^\\n!?]{1,48})$`),
        anchor,
        score: anchor.length,
        slots: 1,
      })
    }
  }
  // Longest literal first inside a bucket: "the %s of %s" beats "%s of %s".
  for (const list of buckets.values()) list.sort((a, b) => b.score - a.score)
  labelPrefix.sort((a, b) => b.score - a.score)
  return { exact: entries, buckets, labelPrefix, size: templates }
}

/** Fill a translated template from captured groups, honouring %N$ order. */
export function fill(tmpl: string, args: string[]): string {
  let i = 0
  // Positional forms (%1$s, used by the dictionary to reorder words) as well as
  // the plain %s/%d/%x/%c forms.
  const FILL = /%(\d+)\$[-+ 0#]*\d*(?:\.\d+)?[sdxc]|%[-+ 0#]*\d*(?:\.\d+)?[sdxc]/g
  return tmpl.replace(FILL, (_raw: string, pos?: string) => {
    if (pos) return args[Number(pos) - 1] ?? ''
    return args[i++] ?? ''
  })
}

export interface Variants {
  raw: string
  trimmed: string
  plain: string          // markup stripped
  plainTrimmed: string
  noHotkey: string       // "g - a potion" -> "a potion"
}

const HOTKEY_PREFIX = /^\s*(?:\([^)]\)|[A-Za-z0-9*!?])\s+[-+#$]\s+/

export function variantsOf(text: string): Variants {
  const trimmed = text.trim()
  const plain = text.replace(/<[^>]*>/g, '')
  // Markup removal leaves double spaces ("Casting: <white>X<cyan> <lightgrey>(…"),
  // which would stop every template from matching; collapse them.
  const plainTrimmed = plain.replace(/\s+/g, ' ').trim()
  const noHotkey = plainTrimmed.replace(HOTKEY_PREFIX, '').trim()
  return { raw: text, trimmed, plain, plainTrimmed, noHotkey }
}

/**
 * Look a single string up. Returns null when nothing safe matched.
 * `opts.allowLabels` enables the "label: value" rule (off for prose bodies
 * where a prefix match could swallow a sentence).
 */
export interface Hit {
  out: string
  key: string
  /** template hit: refill these captures after translating them */
  tmpl?: string
  args?: string[]
  /** label hit: the value after "Label: " (needs place/branch handling) */
  labelTail?: string
}

export function lookup(
  m: Matcher,
  text: string,
  opts: { allowLabels?: boolean; maxSlots?: number } = {},
): Hit | null {
  if (!text) return null
  const v = variantsOf(text)
  const exact = m.exact
  for (const cand of [v.trimmed, v.plainTrimmed, v.noHotkey]) {
    if (!cand) continue
    const hit = exact.get(cand)
    if (hit) return { out: hit, key: cand }
  }

  const maxSlots = opts.maxSlots ?? 3
  const candidates = [v.trimmed, v.plainTrimmed, v.noHotkey]
  for (const cand of candidates) {
    if (!cand) continue
    const first = /[A-Za-z]/.exec(cand)
    const lists = [first ? m.buckets.get(first[0].toLowerCase()) : undefined, m.buckets.get('0')]
    for (const list of lists) {
      if (!list) continue
      for (const t of list) {
        if (t.slots > maxSlots) continue
        if (!cand.includes(t.anchor)) continue
        const hit = t.re.exec(cand)
        if (!hit) continue
        const args = hit.slice(1) as string[]
        return { out: fill(t.tmpl, args), key: t.key, tmpl: t.tmpl, args }
      }
    }
  }

  if (opts.allowLabels) {
    for (const cand of candidates) {
      if (!cand) continue
      for (const t of m.labelPrefix) {
        if (!cand.startsWith(t.key)) continue
        const hit = t.re.exec(cand)
        if (!hit) continue
        const tail = cand.slice(t.key.length)
        return { out: t.tmpl + tail, key: t.key, labelTail: tail }
      }
    }
  }
  return null
}
