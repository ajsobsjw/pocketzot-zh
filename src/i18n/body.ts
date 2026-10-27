// Describe overlays arrive as pre-arranged text, so the DOM translator never
// sees a sentence on its own: property rows come as "rPois:     It protects…"
// and the label/value share one text node. This runs on the assembled body
// before it is rendered: translate the label (property token), then the
// sentence, and re-pad so the value column stays where the engine put it.

import { isZh, t } from './index'
import { propLabel } from './items'
import { EGO_LABELS, translateEgoProse } from './egos'

function displayWidth(s: string): number {
  let n = 0
  for (const ch of s) n += /[^\x00-\xff]/.test(ch) ? 2 : 1
  return n
}

// Stat rows arrive as colour-tagged cells ("<lightgrey>Max HP: 10  </lightgrey>
// <lightgrey>Will: +  </lightgrey>"), so a label can be preceded by opening or
// closing tags and can contain spaces ("Max HP", "Base armour rating"). Match
// the tag/space prefix separately and keep it verbatim; the label itself never
// carries markup.

/** Translate a row label: property tokens first, then the dictionary. */
function labelOf(raw: string): string {
  if (EGO_LABELS[raw.toLowerCase()]) return EGO_LABELS[raw.toLowerCase()]
  const prop = propLabel(raw)
  if (prop !== raw) return prop
  const lower = propLabel(raw.toLowerCase())
  if (lower !== raw.toLowerCase()) return lower
  const brand = t(raw.toLowerCase())
  if (brand !== raw.toLowerCase()) return brand
  return t(raw)
}

// --- engine-composed lines the dictionary cannot key -----------------------
//
// Talisman form panels are assembled in C++ from fragments that never reach the
// dictionary as a whole line: the "Melds:" list, the suppressed-mutation list,
// and the "Your skill: …; use (s) to set …" hint. Run through the generic cell
// matcher they either stay English or, worse, fall into the item-name fallback
// in dom.ts, which quarantines every leftover word ("（Melds:）身体…").
// These rules rebuild the complete line in Chinese, and return null when any
// piece is unknown so the line stays coherently English.

const EQUIP_SLOT_ZH: Record<string, string> = {
  'Weapon': '武器',
  'Shield': '盾牌',
  'Body Armour': '身体护甲',
  'Gloves': '手套',
  'Boots': '靴子',
  'Helmet': '头盔',
  'Cloak': '斗篷',
  'Amulet': '护符',
  'Ring': '戒指',
  'Barding': '马铠',
  'Gizmo': '装置',
  'All Equipment': '全部装备',
  'All Weapons and Armour': '全部武器与护甲',
}

const SUPPRESSED_ZH: Record<string, string> = {
  'Anatomy': '解剖结构',
  'Substance': '物质',
  'Blood': '血液',
  'Bones': '骨骼',
  'Hands': '双手',
}

/** item_prefix() tokens as the describe footer prints them. */
const MENU_PREFIX_ZH: Record<string, string> = {
  'identified': '已鉴定',
  'unidentified': '未鉴定',
  'artefact': '神器',
  'worn': '已穿戴',
  'cursed': '被诅咒',
  'bound': '已束缚',
}

/** "Body Armour, Gloves, Boots" → "身体护甲、手套、靴子" (null if any unknown). */
function translateList(raw: string, table: Record<string, string>): string | null {
  const parts = raw.split(/\s*,\s*/).filter(Boolean)
  if (!parts.length) return null
  const title = (s: string): string => s.replace(/\b[a-z]/g, (c) => c.toUpperCase())
  const zh = parts.map((p) => {
    const hit = table[p] ?? table[title(p)]
    if (hit) return hit
    return t(p) !== p ? t(p) : null
  })
  return zh.every((z): z is string => z != null) ? zh.join('、') : null
}

/** Complete-line rules for computed describe lines; null keeps the original. */
function translateComputedLine(line: string): string | null {
  const lead = line.slice(0, line.length - line.trimStart().length)
  const plain = line.replace(/<[^>]*>/g, '').trim()

  const melds = /^Melds: (.+)$/.exec(plain)
  if (melds) {
    const list = translateList(melds[1], EQUIP_SLOT_ZH)
    return list ? `${lead}融合部位：${list}` : null
  }

  const suppressed = /^Mutations Suppressed: (.+)$/.exec(plain)
  if (suppressed) {
    const list = translateList(suppressed[1], SUPPRESSED_ZH)
    return list ? `${lead}抑制的突变：${list}` : null
  }

  // Technical tokens after this label are stash-search syntax; only the label
  // is prose. Without this rule the line fell into the item-name fallback and
  // came out as "（Menu/colouring) （prefixes:) …".
  const stash = /^Stash search prefixes: (.+)$/.exec(plain)
  if (stash) return `${lead}储藏搜索前缀：${stash[1]}`

  const menuPrefix = /^Menu\/colouring prefixes: (.+)$/.exec(plain)
  if (menuPrefix) {
    const tags = menuPrefix[1].split(/\s+/).filter(Boolean)
    const zh = tags.map((tag) => {
      const key = tag.replace(/^\(|\)$/g, '')
      const hit = MENU_PREFIX_ZH[key]
      return hit ? `（${hit}）` : null
    })
    if (zh.every((z): z is string => z != null)) return `${lead}菜单/着色前缀：${zh.join('')}`
    return null
  }

  // "Your skill: 0.0; use (s) to set 7.0 as a target for Shapeshifting."
  // "Your (base) skill: 12.3." — the target hint is optional.
  const skill = /^Your (\(base\) )?skill: (\d+(?:\.\d+)?)(?:; use \(s\) to set (\d+(?:\.\d+)?) as a target for (.+?))?\.?$/.exec(plain)
  if (skill) {
    const head = `${lead}你的${skill[1] ? '基础' : ''}技能：${skill[2]}`
    if (!skill[3]) return `${head}。`
    const name = t(skill[4])
    if (name === skill[4]) return null
    return `${head}；使用 (s) 可将${name}的目标设为 ${skill[3]}。`
  }

  return null
}

/** Translate one "Label: value" cell, re-padding the value to its old column. */
function translateCell(cell: string): string {
  // A closing colour tag belongs to the cell, not to the value: a dictionary
  // hit returns plain text, so put the tag back rather than dropping it.
  const tail = /((?:<\/[a-zA-Z]+>)+)$/.exec(cell)?.[1] ?? ''
  const body = tail ? cell.slice(0, -tail.length) : cell
  const m = /^((?:\s|<[^>]+>)*)([^<\s][^<:]{0,39}?):(\s+)(.+)$/.exec(body)
  if (m) {
    const [, lead, rawLabel, spaces, rawValue] = m
    const label = labelOf(rawLabel)
    const value = t(rawValue)
    // A label translated while its value stays English would print half a
    // sentence. Keep the whole cell English instead; the panel can fall back.
    if (value === rawValue && /[A-Za-z]{3,}/.test(rawValue.replace(/<[^>]*>/g, ''))
      && label !== rawLabel) {
      return cell
    }
    if (label !== rawLabel || value !== rawValue) {
      const target = displayWidth(rawLabel) + spaces.length
      const pad = Math.max(1, target - displayWidth(label))
      return tidy(`${lead}${label}:${' '.repeat(pad)}${value}${tail}`)
    }
  }
  // Labels outside the property table ("Base armour rating", "Encumbrance
  // rating") are ordinary dictionary keys: try the whole cell.
  const trimmed = body.trim()
  if (!trimmed) return cell
  const whole = t(trimmed)
  if (whole === trimmed) return cell
  return body.slice(0, body.length - body.trimStart().length) + tidy(whole) + tail
}

/** Translate one pre-split cell (table header, label/value, lone word). */
function translateCellText(text: string): string {
  // Label-only cell (the value lives in the next column).
  const labelOnly = /^([^\s<][^<:]{0,39}?):$/.exec(text)
  if (labelOnly) {
    const label = labelOf(labelOnly[1])
    if (label !== labelOnly[1]) return label + ':'
  }
  const cell = translateCell(text)
  if (cell !== text) return cell
  const whole = t(text)
  return whole !== text ? tidy(whole) : text
}

const stripTags = (s: string): string => s.replace(/<[^>]*>/g, '')

/** Split a cell into leading markup/space, plain core, trailing markup/space. */
function splitCell(piece: string): { pre: string; core: string; post: string } {
  const pre = /^(?:\s|<[^>]+>)*/.exec(piece)?.[0] ?? ''
  const rest = piece.slice(pre.length)
  const post = /(?:\s|<[^>]+>)*$/.exec(rest)?.[0] ?? ''
  return { pre, core: rest.slice(0, rest.length - post.length), post }
}

/**
 * Re-flow one pre-arranged line cell by cell. The engine pads columns with
 * runs of spaces; replacing a label with a shorter (or wider) Chinese one must
 * keep every following cell at its original display column, otherwise the
 * transposed talisman table turns into ragged columns. Returns null when
 * nothing changed.
 */
function reflowCells(pieces: string[]): string | null {
  const starts: number[] = []
  let col = 0
  for (let i = 0; i < pieces.length; i++) {
    if (i % 2 === 0) starts[i] = col
    col += displayWidth(stripTags(pieces[i]))
  }
  let out = ''
  let pos = 0
  let emitted = false
  let changed = false
  for (let i = 0; i < pieces.length; i += 2) {
    const piece = pieces[i]
    const target = starts[i]
    if (!piece) continue
    const { pre, core, post } = splitCell(piece)
    const lead = core.slice(0, core.length - core.trimStart().length)
    const text = core.trim()
    if (!text) {
      // Tag-only / whitespace-only cell: keep it verbatim.
      out += piece
      pos += displayWidth(stripTags(piece))
      continue
    }
    // A tag inside the text itself (mid-sentence colour change) is left alone:
    // translating it would drop the markup.
    const translated = core.includes('<') ? text : translateCellText(text)
    const gap = emitted ? Math.max(1, target - pos) : Math.max(0, target)
    out += ' '.repeat(gap) + pre + lead + translated + post
    pos = target + displayWidth(lead) + displayWidth(translated)
    emitted = true
    if (translated !== text) changed = true
  }
  return changed ? out.trimEnd() : null
}

// A row label is a short Latin phrase at the start of the line ("Max HP",
// "Base armour rating", "Attack"), optionally behind colour tags. Keep it
// tight: a prose sentence rarely starts with 1–40 word characters and a colon.
const LABEL_ROW = /^\s*(?:<[^>]+>)*[A-Za-z][\w .'+-]{0,38}?:\s+\S/

// These lines are complete sentences with their own optional indented
// continuation ("At current training…"), so the property-row merger must leave
// them alone.
const COMPUTED_START = /^\s*(?:<[^>]+>)*(?:Melds:|Mutations Suppressed:|Your (?:\(base\) )?skill:)/

/** Translate the property/value rows and stray sentences of a describe body. */
export function translateBody(body: string): string {
  if (!isZh() || !body) return body
  body = body.split(/(\n[ \t]*\n)/).map((block, i) => {
    if (i % 2) return block
    const plain = stripTags(block).trim()
    const row = /^([^:]{1,40}):\s+([\s\S]+)$/.exec(plain)
    const explanation = translateEgoProse(row ? row[2] : plain)
    return explanation ? (row ? `${labelOf(row[1])}：` : '') + explanation : block
  }).join('')
  // The engine hard-wraps long property values ("Flame:  It burns victims,\n
  // dealing …"). Join indented continuation lines back onto their label so the
  // sentence can match; the overlay wraps the merged line again on screen.
  const raw = body.split('\n')
  const lines: string[] = []
  for (let i = 0; i < raw.length; i++) {
    const line = raw[i]
    const label = LABEL_ROW.exec(line)
    if (label && !COMPUTED_START.test(line) && i + 1 < raw.length) {
      let value = line
      while (i + 1 < raw.length
        && /^\s{2,}\S/.test(raw[i + 1])
        && !LABEL_ROW.test(raw[i + 1])
        && !COMPUTED_START.test(raw[i + 1])
        && !/^\s*$/.test(raw[i + 1])) {
        value += ' ' + raw[i + 1].trim()
        i++
      }
      lines.push(value)
      continue
    }
    lines.push(line)
  }
  return lines.map((line) => {
    // Match the explanation before padding splits labels from values, and
    // before internal colour tags can cause the generic reflow to skip it.
    const plain = stripTags(line).trim()
    const egoRow = /^([^:]{1,40}):\s+(.+)$/.exec(plain)
    if (egoRow) {
      const explanation = translateEgoProse(egoRow[2])
      if (explanation) return `${labelOf(egoRow[1])}：${explanation}`
    }
    const ego = translateEgoProse(plain)
    if (ego) return ego
    const weapon = translateWeaponCategory(plain)
    if (weapon) return weapon
    if (/\((?:Ench|Slay|Hvy)(?: \+ Slay)?\)/.test(line)) {
      line = line.replace(/\bEnch\b/g, '附魔').replace(/\bSlay\b/g, '杀戮').replace(/\bHvy\b/g, '沉重')
    }
    const computed = translateComputedLine(line)
    if (computed) return computed
    // Rows can carry several labelled cells separated by the engine's column
    // gaps ("Base armour rating: 2       Encumbrance rating: 0"): translate
    // each cell on its own and keep the following cells in their columns.
    const pieces = line.split(/(\s{2,})/)
    if (pieces.length > 1) {
      const out = reflowCells(pieces)
      if (out != null) return out
    }
    const cell = translateCell(line)
    if (cell !== line) return cell
    const trimmed = line.trim()
    if (!trimmed) return line
    const zh = t(trimmed)
    if (zh !== trimmed) return line.slice(0, line.length - line.trimStart().length) + tidy(zh)
    return line
  }).join('\n')
}

function translateWeaponCategory(text: string): string | null {
  const match = /^This weapon falls into the [‘’'"](.+?)[‘’'"] category\.\s*(.*)$/.exec(text)
  if (!match) return null
  const skill = t(match[1])
  if (skill === match[1]) return null
  const fragments: Record<string, string> = {
    'It is extremely good for stabbing helpless or unaware enemies.': '它极其擅长刺杀无力反抗或毫无察觉的敌人。',
    'It is good for stabbing helpless or unaware enemies.': '它擅长刺杀无力反抗或毫无察觉的敌人。',
    'It is a one-handed weapon.': '这是一把单手武器。',
    'It is a two-handed weapon.': '这是一把双手武器。',
    'It can be used to attack enemies two spaces away.': '它能攻击两格外的敌人。',
    'It has an extended reach (target with [v]).': '它的攻击距离更远（按 [v] 选择目标）。',
    'It has an extended reach.': '它的攻击距离更远。',
    'It hits all enemies adjacent to the wielder, dealing less damage to those not targeted.': '它攻击持用者相邻的所有敌人，对非主要目标造成较低伤害。',
    'It hits all enemies adjacent to the wielder.': '它攻击持用者相邻的所有敌人。',
  }
  const sentences = match[2].trim() ? match[2].trim().split(/(?<=\.)\s+/) : []
  const translated = sentences.map((s) => fragments[s] ?? (t(s) !== s ? t(s) : null))
  if (translated.some((s) => s === null)) return null
  return `这把武器属于“${skill}”类别。${translated.join('')}`
}

/** One "label: value" text node, for the DOM translator (menus included). */
export function translateLabeledText(text: string): string | null {
  if (!isZh()) return null
  const m = /^(\s*)([^<\s][^<:]{0,39}?):(\s+)(.*)$/.exec(text)
  if (!m) return null
  const label = labelOf(m[2])
  const desc = m[4] ? t(m[4]) : ''
  if (label === m[2] && desc === m[4]) return null
  const target = displayWidth(m[2]) + m[3].length
  const pad = Math.max(1, target - displayWidth(label))
  return tidy(`${m[1]}${label}:${' '.repeat(pad)}${desc}`)
}

/** Chinese typography for lines the dictionary left with ASCII punctuation. */
function tidy(s: string): string {
  if (!/[\u4e00-\u9fff]/.test(s)) return s
  return s.replace(/\s*->\s*/g, ' → ').replace(/\.\s*$/, '。')
}
