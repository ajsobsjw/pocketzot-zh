// Describe overlays arrive as pre-arranged text, so the DOM translator never
// sees a sentence on its own: property rows come as "rPois:     It protects…"
// and the label/value share one text node. This runs on the assembled body
// before it is rendered: translate the label (property token), then the
// sentence, and re-pad so the value column stays where the engine put it.

import { isZh, t } from './index'
import { propLabel } from './items'
import { EGO_LABELS, translateEgoProse } from './egos'
import { matchTitle, spellField, spellSchools, spellTrainingSkill } from './titles'

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
  if (DESCRIBE_LABELS[raw]) return DESCRIBE_LABELS[raw]
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
  'emergency_item': '应急物品', 'good_item': '优质物品', 'bad_item': '劣质物品',
  'useless_item': '无用物品', 'equipped': '已装备', 'potion': '药水',
  'armour': '护甲', 'weapon': '武器', 'jewellery': '首饰', 'missile': '投掷物',
  'book': '书籍', 'wand': '魔杖', 'staff': '法杖', 'scroll': '卷轴',
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
    const joined = /^(.*?)(potion|armour|weapon|jewellery|missile|book|wand|staff|scroll|food|misc)(SPELLSET_PLACEHOLDER)?$/.exec(menuPrefix[1])
    if (joined) {
      const prefixTokens = joined[1].match(/\([^)]*\)|\S+/g) ?? []
      const prefix = prefixTokens.map((token) => MENU_PREFIX_ZH[token] ?? token)
      return `${lead}菜单/着色前缀：${[...prefix, MENU_PREFIX_ZH[joined[2]]].join(' ')}${joined[3] ?? ''}`
    }
    const combined = /^(.+?)\s+(.+)$/.exec(menuPrefix[1])
    if (combined) {
      const category = MENU_PREFIX_ZH[combined[2]]
      const flags = combined[1].match(/\([^)]*\)|\S+/g) ?? []
      const localizedFlags = flags.map((flag) => MENU_PREFIX_ZH[flag] ?? MENU_PREFIX_ZH[`(${flag})`] ?? flag)
      if (category) return `${lead}菜单/着色前缀：${localizedFlags.join(' ')} ${category}`
    }
    const tokens = menuPrefix[1].match(/\([^)]*\)|\S+/g) ?? []
    const zh = tokens.map((tag) => {
      const parenthesized = tag.startsWith('(') && tag.endsWith(')')
      const key = parenthesized ? tag.slice(1, -1) : tag
      const hit = MENU_PREFIX_ZH[key]
      return hit ? `${parenthesized ? '（' : ''}${hit}${parenthesized ? '）' : ''}` : tag
    })
    return `${lead}菜单/着色前缀：${zh.join(' ')}`
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
const LABEL_ROW = /^\s*(?:<[^>]+>)*[A-Za-z][\w .'+-]{0,38}?(?:<[^>]+>)*:\s+\S/
const DESCRIBE_LABELS: Record<string, string> = {
  School: '学派', Schools: '学派', Fail: '失败率', Failure: '失败率', Level: '等级', Power: '威力',
  Damage: '伤害', Range: '射程', Noise: '噪音', Defences: '防御', Defence: '防御',
  Resists: '抗性', Resistances: '抗性', Misc: '其他', Status: '状态', Quote: '引言',
  Attack: '攻击', Speed: '速度', AC: '护甲', EV: '闪避', Will: '意志',
}

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
    const plain = stripTags(line).replace(/\u0001/g, '').trim()
    const outerColor = /^(\s*<([a-z]+)>).*<\/\2>\s*$/i.exec(line)
    const keepColor = (text: string): string => outerColor ? `${outerColor[1]}${text}</${outerColor[2]}>` : text
    const standaloneNoise = /^\(Noise:\s*([^)]+)\)\s*(.+)$/.exec(plain)
    if (standaloneNoise) {
      const level = spellField('Noise', standaloneNoise[1])
      return keepColor(`噪音：${level === standaloneNoise[1] ? standaloneNoise[1] : level}，${spellField('Noise', standaloneNoise[2])}`)
    }
    const experience = /^(\s*)\((\d+) xp, (\d+) skp\)$/.exec(line)
    if (experience) return `${experience[1]}（${experience[2]} 经验，${experience[3]} 技能点）`
    if (plain === 'This armour is completely useless to you: that is too small for you to equip!')
      return keepColor('这件护甲对你毫无用处：你体型太大，穿不上它！')
    const fullSpellMeta = /^Level:\s*(\d+)\s+Schools?:\s*(.+?)\s+Fail:\s*(\d+)%$/.exec(plain)
    if (fullSpellMeta) return keepColor(`等级：${fullSpellMeta[1]}  学派：${spellSchools(fullSpellMeta[2])}  失败率：${fullSpellMeta[3]}%`)
    const labelValue = /^([^:]{1,40}):\s*(.*)$/.exec(plain)
    if (labelValue && DESCRIBE_LABELS[labelValue[1]]) {
      const label = DESCRIBE_LABELS[labelValue[1]]
      const value = labelValue[2]
      if (/^(?:Noise|School|Schools|Defences|Resists|Resistances)$/.test(labelValue[1])) {
        const noise = /^(?:\((?:Noise:\s*)?([^)]+)\)\s*)?(.+)$/.exec(value)
        if (labelValue[1] === 'Noise' && noise) {
          const level = noise[1] ? spellField('Noise', noise[1].trim()) : ''
          const quality = spellField('Noise', noise[2].trim())
          return keepColor(`噪音：${level ? `${level}，` : ''}${quality}`)
        }
        return keepColor(`${label}：${spellField(labelValue[1], value)}`)
      }
      return keepColor(`${label}：${value.replace(/\bmax\b/g, '最高').replace(/\bcollision\b/g, '撞击')}`)
    }
    const detail = translateSpellDetail(line)
    if (detail) return detail
    const itemDetail = translateItemDetail(line)
    if (itemDetail) return itemDetail
    const structured = matchTitle(plain)
    if (structured) return structured
    const egoRow = /^([^:]{1,40}):\s+(.+)$/.exec(plain)
    if (egoRow) {
      const explanation = translateEgoProse(egoRow[2])
      if (explanation) {
        const original = egoRow[1]
        const label = labelOf(original)
        const valueStart = line.indexOf(egoRow[2])
        if (valueStart >= 0 && /<[^>]+>/.test(line)) {
          const before = line.slice(0, valueStart)
          const labelStart = before.indexOf(original)
          if (labelStart >= 0) {
            const prefix = before.slice(0, labelStart) + label + before.slice(labelStart + original.length)
            return prefix.replace(':', '：') + explanation + line.slice(valueStart + egoRow[2].length)
          }
        }
        return `${label}：${explanation}`
      }
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
    if (line.includes('\u0001')) {
      const unmarked = line.replace('\u0001', '')
      const translated = translateCell(unmarked)
      if (translated !== unmarked) return line.slice(0, line.indexOf('\u0001')) + '\u0001' + translated.slice(line.indexOf('\u0001'))
    }
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

function translateSpellDetail(line: string): string | null {
  const plain = stripTags(line).trim()
  if (/^You (?:aren't|are not) experienced enough to cast this spell\.$/.test(plain)) {
    return '你的经验等级不足，无法施放此法术。'
  }
  const miscast = /^Miscasting this spell causes magic contamination and also deals up to (\d+) (.+?) damage\.$/.exec(plain)
  if (miscast) {
    const damage: Record<string, string> = { electric: '电击', electricity: '电击', fire: '火焰', cold: '寒冷', poison: '毒素', acid: '酸' }
    return `施法失误会造成魔法污染，并额外造成最多 ${miscast[1]} 点${damage[miscast[2]] ?? miscast[2]}伤害。`
  }
  const anchored = /^Miscasting this spell causes magic contamination and also either anchors you in place or deals up to (\d+) irresistible damage\.$/.exec(plain)
  if (anchored) return `施放此法术失误会造成魔法污染，并可能将你定在原地，或造成最多 ${anchored[1]} 点无法抵抗的伤害。`
  const horrorAndDamage = /^Miscasting this spell causes magic contamination and also either summons a nameless horror or deals up to (\d+) (\w+) damage\.$/.exec(plain)
  if (horrorAndDamage) {
    const element: Record<string, string> = { cold: '寒冷', fire: '火焰', electric: '电击', electricity: '电击', acid: '酸', poison: '毒素' }
    const damage = element[horrorAndDamage[2]]
    if (damage) return `施放此法术失误会造成魔法污染，并可能召唤无名恐怖，或造成最多 ${horrorAndDamage[1]} 点${damage}伤害。`
  }
  const poisonOrDamage = /^Miscasting this spell causes magic contamination and also either poisons you or deals up to (\d+) irresistible damage\.$/.exec(plain)
  if (poisonOrDamage) return `施放此法术失误会造成魔法污染，并可能使你中毒，或造成最多 ${poisonOrDamage[1]} 点无法抵抗的伤害。`
  const training = /^With your current stats and equipment, training (.+?) to ([\d.]+) would reduce (?:your|the) failure rate to (\d+)%\. This would take about ([\d.]+) XLs?\.?$/.exec(plain)
  if (training) {
    const skill = spellTrainingSkill(training[1]) ?? t(training[1])
    if (skill !== training[1]) return `以你当前的属性和装备，把${skill}训练到 ${training[2]} 可将失败率降到 ${training[3]}%。这大约需要 ${training[4]} 个等级。`
  }
  const sustain = /^You can sustain at most (one|two|three|four|five|six|seven|eight|nine|ten|\d+) creatures? summoned by this spell\.$/i.exec(plain)
  if (sustain) {
    const counts: Record<string, string> = { one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', ten: '10' }
    return `你最多只能维持 ${counts[sustain[1].toLowerCase()] ?? sustain[1]} 个由此法术召唤的生物。`
  }
  return null
}

function translateItemDetail(line: string): string | null {
  const plain = stripTags(line).trim()
  const noEffect = /^Drinking this right now will have no effect: (.+)\.$/.exec(plain)
  if (noEffect) {
    const reasons: Record<string, string> = {
      'your magic is already full': '你的魔力已经全满',
      'you are already healthy enough': '你的伤势已经基本痊愈',
      'you are already hasted': '你已经处于加速状态',
    }
    const reason = reasons[noEffect[1].toLowerCase()]
    if (reason) return `现在饮用不会产生效果：${reason}。`
  }
  if (plain === 'It is a rare potion.') return '那是一瓶稀有药水。'
  return null
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
