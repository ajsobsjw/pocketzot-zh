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

// The wire text often uses typographic punctuation (the engine's own
// apostrophes: "can’t", curly quotes, en/em dashes, "…"), while the dictionary
// keys are plain ASCII. Normalize both sides for *matching only*: the rendered
// text always comes from the dictionary or from the untouched original, so a
// miss still shows exactly what the server sent.
const SMART_QUOTES = /[\u2018\u2019\u201a\u201b\u2032]/g
const SMART_DQUOTES = /[\u201c\u201d\u201e\u201f\u2033]/g
const SMART_DASHES = /[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g

export function normalizePunct(s: string): string {
  return s
    .replace(SMART_QUOTES, "'")
    .replace(SMART_DQUOTES, '"')
    .replace(SMART_DASHES, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u00a0/g, ' ')
}

// Build the literal part of a template regex so it accepts either punctuation
// style while the match still runs on the original string (captured names keep
// the server's punctuation unchanged).
function flexEscape(s: string): string {
  return escapeRe(s)
    .replace(/\\\.\\\.\\\./g, '(?:\\.\\.\\.|\u2026)')
    .replace(/'/g, "['\u2018\u2019]")
    .replace(/"/g, '["\u201c\u201d]')
    .replace(/-/g, '[-\u2010-\u2015\u2212]')
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
    body += flexEscape(part)
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
  return {
    key, tmpl, re: new RegExp(`^${body}$`),
    // The candidate is compared after punctuation normalization, so the anchor
    // must be normalized too (a curly apostrophe never appears in a key).
    anchor: normalizePunct(best), score, slots: kinds.length,
  }
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
        re: new RegExp(`^${flexEscape(key)}([^\\n!?]{1,48})$`),
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

const ENTITIES: Record<string, string> = {
  '&apos;': "'", '&#39;': "'", '&#x27;': "'",
  '&quot;': '"', '&#34;': '"', '&#x22;': '"',
  '&amp;': '&',
}

/** Decode the few HTML entities a wire line can carry, for matching only. */
function decodeEntities(s: string): string {
  return s.replace(/&(?:apos|quot|amp|#39|#34|#x27|#x22);/gi,
    (m) => ENTITIES[m.toLowerCase()] ?? m)
}

export function variantsOf(text: string): Variants {
  const trimmed = text.trim()
  const plain = decodeEntities(text.replace(/<[^>]*>/g, ''))
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
  const candidates = [v.trimmed, v.plainTrimmed, v.noHotkey]
  for (const cand of candidates) {
    if (!cand) continue
    const hit = exact.get(cand) ?? exact.get(normalizePunct(cand))
    if (hit) return { out: hit, key: cand }
  }

  const maxSlots = opts.maxSlots ?? 3
  for (const cand of candidates) {
    if (!cand) continue
    const first = /[A-Za-z]/.exec(cand)
    const lists = [first ? m.buckets.get(first[0].toLowerCase()) : undefined, m.buckets.get('0')]
    // Anchor test on the normalized candidate: the template regex accepts both
    // punctuation styles, but the plain substring test would not.
    let normCand: string | undefined
    for (const list of lists) {
      if (!list) continue
      for (const t of list) {
        if (t.slots > maxSlots) continue
        normCand ??= normalizePunct(cand)
        if (!normCand.includes(t.anchor)) continue
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
      const normCand = normalizePunct(cand)
      for (const t of m.labelPrefix) {
        const key = normalizePunct(t.key)
        if (!normCand.startsWith(key)) continue
        const hit = t.re.exec(cand)
        if (!hit) continue
        const tail = normCand.slice(key.length)
        return { out: t.tmpl + tail, key: t.key, labelTail: tail }
      }
    }
  }
  return null
}
