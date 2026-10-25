// Monster describe panel.
//
// The panel is composed from engine strings that never carry a dictionary key:
// the to-hit line, the attack table, the notice chance, the speed line, and the
// status list at the bottom. They also mix computed values (dice, percentages)
// into English prose, so running them through the generic matcher leaves half
// a sentence behind. Everything here is structural: each rule either rebuilds
// the whole line in Chinese or returns null so the caller keeps the English
// one. A table row is translated as a unit — a row with one unknown cell stays
// English rather than mixing languages.

import { isZh, t, tItem } from './index'
import { lookupMonsterStatus, lookupProse } from './describe'
import { translateBody } from './body'

function displayWidth(s: string): number {
  let n = 0
  for (const ch of s) n += /[^\x00-\xff]/.test(ch) ? 2 : 1
  return n
}

const PRONOUN: Record<string, string> = { It: '它', They: '它们', He: '他', She: '她' }

/** "a, b and c" → "a、b与c" */
function zhList(items: string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join('、')}与${items[items.length - 1]}`
}

/** Attack names as mon_attack_name_short() uppercases them. */
const ATTACK_NAMES: Record<string, string> = {
  hit: '击打',
  bite: '咬',
  sting: '蜇刺',
  spore: '孢子',
  touch: '触碰',
  engulf: '吞噬',
  claw: '爪击',
  peck: '啄',
  headbutt: '头撞',
  punch: '拳击',
  kick: '踢击',
  'tentacle-slap': '触手拍击',
  tentacle: '触手拍击',
  'tail-slap': '尾击',
  tail: '尾击',
  gore: '顶撞',
  constrict: '缠绕',
  trample: '践踏',
  'trunk-slap': '象鼻拍击',
  trunk: '象鼻拍击',
  pounce: '扑击',
  shoot: '射击',
  'hit or gore': '击打或顶撞',
  'hit, bite, peck, or gore': '击打、咬、啄或顶撞',
  throw: '投掷',
}

/** Player auxiliary attacks (melee-attack.cc) and hand names. */
const AUX_NAMES: Record<string, string> = {
  hands: '双手',
  hand: '手',
  claw: '爪',
  claws: '爪',
  talon: '利爪',
  talons: '利爪',
  tentacle: '触手',
  tentacles: '触手',
  pseudopod: '伪足',
  pseudopods: '伪足',
  fist: '拳头',
  fists: '拳头',
  paw: '爪子',
  paws: '爪子',
  hoof: '蹄',
  hooves: '蹄',
  bite: '咬',
  maw: '巨口',
  chomp: '撕咬',
  grab: '抓握',
  kick: '踢',
  headbutt: '头撞',
  peck: '啄',
  'tail-slap': '尾击',
  punch: '拳击',
  'off-hand punch': '副手拳击',
  squeeze: '挤压',
  touch: '触碰',
  sting: '蜇刺',
  slice: '切割',
  'whirl of blades': '利刃旋舞',
  shroompunch: '蘑菇拳',
  blades: '利刃',
  constrict: '缠绕',
}

/** Weapon brands as brand_type_name() prints them. */
const BRAND_NAMES: Record<string, string> = {
  flaming: '烈焰',
  freezing: '寒霜',
  draining: '吸取',
  electrocution: '雷电',
  concussion: '震荡',
  distortion: '扭曲',
  'holy wrath': '圣光',
  'foul flame': '秽焰',
  pain: '痛苦',
  valour: '勇武',
  entangling: '缠绕',
  sundering: '碎裂',
  venom: '剧毒',
  antimagic: '禁魔',
  chaos: '混沌',
  speed: '疾速',
  protection: '防护',
  fire: '火焰',
  cold: '寒冷',
  elec: '电击',
  earth: '大地',
  poison: '毒素',
  energy: '能量',
  curare: '箭毒',
}

/** _flavour_base_desc() in describe.cc, plus the throwing-row specials. */
const BONUS_NAMES: Record<string, string> = {
  'acid damage': '酸伤害',
  'blink self': '自身闪烁',
  'blink together with the defender': '与目标一起闪烁',
  'cold damage': '寒冷伤害',
  'cause confusion': '造成混乱',
  'drain life': '吸取生命',
  'drain health from the living': '从活物吸取生命',
  'drain speed': '吸取速度',
  'drain magic': '吸取法力',
  'drain speed and health': '吸取速度与生命',
  'electric damage': '电击伤害',
  'fire damage': '火焰伤害',
  'remove fire resistance': '移除火焰抗性',
  'poison and momentary paralysis': '毒素与短暂麻痹',
  'poison and paralysis/slowing': '毒素与麻痹/减速',
  poison: '毒素',
  'strong poison': '强毒素',
  distortion: '扭曲',
  'drive defenders berserk': '使目标狂暴',
  chaos: '混沌',
  'steal items': '偷窃物品',
  'begin ongoing constriction': '开始持续缠绕',
  'extra damage to undead/demons': '对亡灵/恶魔额外伤害',
  'extra pain damage to the living': '对活物额外痛苦伤害',
  'ensnare with webbing': '用蛛网束缚',
  "flood the defender's lungs": '淹没目标的肺',
  'reduce willpower': '降低意志',
  'increased damage when unseen': '未被看见时伤害提高',
  'drowning damage': '溺水伤害',
  'spread contamination & shallow water': '传播污染与浅水',
  'cause corrosion': '造成腐蚀',
  'knock back the defender': '击退目标',
  'cause weakness': '造成虚弱',
  'embed barbs': '嵌入倒刺',
  'summon a spider': '召唤蜘蛛',
  'become enraged on drawing blood': '见血后狂暴',
  'induce sleep': '造成睡眠',
  'swoops behind the defender beforehand': '先俯冲到目标身后',
  'slips behind the defender beforehand': '先绕到目标身后',
  'drag the defender backwards': '将目标向后拖拽',
  'extra damage, especially to the good': '额外伤害，尤其对善良阵营',
  'summon demonic beasts': '召唤恶魔野兽',
  'summon more of itself': '召唤同类',
  'vent poison clouds': '释放毒雾',
  'deploy bomblets': '部署炸弹',
  'open air damage': '空袭伤害',
  'drain, daze, or confuse': '吸取、晕眩或混乱',
  'random ugly thing damage': '随机丑东西伤害',
  'inflict doom': '施加厄运',
  'slowly slimify the target': '缓慢黏液化目标',
  "diminish the target's spells": '削弱目标法术',
  'grow burstshrooms behind the defender': '在目标身后种下爆菇',
  // throwing rows
  'ensnare in a net': '用网束缚',
  'poison and slowing': '毒素与减速',
  'blinding and confusion': '致盲与混乱',
  'drive defenders into a frenzy': '使目标陷入狂乱',
  'blink the defender away': '使目标闪烁离开',
  'blink the defender repeatedly': '使目标反复闪烁',
}

const DAMAGE_NAMES: Record<string, string> = {
  fire: '火焰',
  cold: '寒冷',
  poison: '毒素',
  'negative energy': '负能量',
  electricity: '电击',
  elec: '电击',
  acid: '强酸',
  corrosion: '腐蚀',
  blinding: '致盲',
  miasma: '瘴气',
  torment: '折磨',
  damnation: '诅咒',
  steam: '蒸汽',
  drowning: '溺水',
  'clouds of all kinds': '各种云雾',
  'sticky flames': '黏性火焰',
  asphyxiation: '窒息',
  mutation: '变异',
  hellfire: '地狱火',
  silver: '银',
  holy: '神圣',
  pain: '痛苦',
  drain: '吸取',
  'acid damage': '酸伤害',
}

const lowerFirst = (s: string): string => s.charAt(0).toLowerCase() + s.slice(1)

// --- to-hit line -----------------------------------------------------------

function translateHitPart(part: string): string | null {
  const aux = part.split(/\s*,\s*and\s+|\s*,\s*|\s+and\s+/)
  if (aux.length > 1) {
    const zh = aux.map((a) => AUX_NAMES[a.toLowerCase()])
    return zh.every(Boolean) ? zhList(zh as string[]) : null
  }
  const lower = part.toLowerCase()
  if (AUX_NAMES[lower]) return AUX_NAMES[lower]
  // Weapon in hand: "+0 dagger", "a +2 trident".
  const stripped = part.replace(/^(?:a|an|the)\s+/i, '')
  const item = tItem(stripped)
  if (item !== stripped && !/[A-Za-z]{3,}/.test(item)) return item
  return null
}

function translateHitLine(line: string): string | null {
  const m = /^You have (.+?)((?: \([^()]*\))*)\.$/.exec(line)
  if (!m) return null
  const body = m[1]
  const suffixes = m[2]
  const segments = body.split(/(?= and \d+% to hit with your )/)
  const first = /^(?:about )?(\d+)% to hit with your (.+)$/.exec(segments[0])
  if (!first) return null
  const firstPart = translateHitPart(first[2])
  if (!firstPart) return null
  const parts = [`你有约 ${first[1]}% 的几率用你的${firstPart}命中`]
  for (const seg of segments.slice(1)) {
    const more = /^ and (\d+)% to hit with your (.+)$/.exec(seg)
    if (!more) return null
    const part = translateHitPart(more[2])
    if (!part) return null
    parts.push(`另有 ${more[1]}% 的几率用你的${part}命中`)
  }
  let suffix = ''
  if (suffixes.includes('(while incapacitated)')) suffix += '（在无力化状态下）'
  else if (suffixes.includes('(at present)')) suffix += '（目前）'
  if (suffixes.includes('(while you are blinded and from distance ')) {
    const d = /\(while you are blinded and from distance (\d+)\)/.exec(suffixes)
    if (!d) return null
    suffix += `（当你失明且距离 ${d[1]} 时）`
  } else if (suffixes.includes('(at this distance)')) {
    suffix += '（当前距离下）'
  }
  // Any other parenthetical would be dropped silently — refuse instead.
  const known = /\((?:while incapacitated|at present|while you are blinded and from distance \d+|at this distance)\)/g
  if (suffixes.replace(known, '').trim()) return null
  return `${parts.join('，')}${suffix}。`
}

function translateMonsToHitYou(line: string): string | null {
  // _describe_mons_to_hit(): "It has about 70% to hit you."
  const m = /^(It|They|He|She) (?:has|have) about (\d+)% to hit you\.$/.exec(line)
  if (!m) return null
  return `${PRONOUN[m[1]]}命中你的几率约为 ${m[2]}%。`
}

// --- draconian colour paragraph -------------------------------------------

const DRACONIAN_COLOURS: Record<string, string> = {
  black: '黑色',
  yellow: '黄色',
  green: '绿色',
  purple: '紫色',
  red: '红色',
  white: '白色',
  grey: '灰色',
  pale: '苍白',
}

const DRACONIAN_SENTENCES: Record<string, string> = {
  'Sparks flare out of its mouth and nostrils.': '火花从它的口鼻中喷出。',
  'Acidic fumes swirl around it.': '酸性烟雾在它周围盘旋。',
  'Venom drips from its jaws and stinger tail.': '毒液从它的下颚和带刺的尾巴滴落。',
  'Its outline shimmers with magical energy.': '它的轮廓闪烁着魔法能量。',
  'Smoke pours from its nostrils.': '烟雾从它的鼻孔中涌出。',
  'Frost pours from its nostrils.': '寒霜从它的鼻孔中喷出。',
  'Its scales and tail are adapted to the water.': '它的鳞片和尾巴适应了水中生活。',
  'It is cloaked in a pall of superheated steam.': '它被一团过热的蒸汽笼罩。',
}

function translateDraconian(line: string): string | null {
  const m = /^It has (black|yellow|green|purple|red|white|grey|pale) scales\.(?: (.*))?$/.exec(line)
  if (!m) return null
  const head = `它长着${DRACONIAN_COLOURS[m[1]]}鳞片。`
  if (!m[2]) return head
  const tail = DRACONIAN_SENTENCES[m[2]]
  return tail ? head + tail : null
}

// --- notice chance ---------------------------------------------------------

function translateNoticeLine(line: string): string | null {
  const m = /^(It|They|He|She) (?:has|have) a (\d+)% chance to notice you each turn\.$/.exec(line)
  if (!m) return null
  return `${PRONOUN[m[1]]}每回合有 ${m[2]}% 的几率注意到你。`
}

// --- speed -----------------------------------------------------------------

const ENERGY_NAMES: Record<string, string> = {
  attack: '攻击',
  shoot: '射击',
  travel: '移动',
  swim: '游泳',
  pray: '祈祷',
  magic: '施法',
}

function translateSpeedLine(line: string): string | null {
  // "Speed: 110% (attack: 100%, travel: 80%) (normally travels slower than you)"
  // — the energy list and the travel comment are separate parentheticals.
  const m = /^Speed: (\d+)%((?: \([^()]*\))*)$/.exec(line)
  if (!m) return null
  const groups = [...m[2].matchAll(/\(([^()]*)\)/g)].map((x) => x[1])
  const bits: string[] = []
  for (const group of groups) {
    if (group === 'but often pauses') { bits.push('但经常停顿'); continue }
    if (group === 'normally travels faster than you') { bits.push('通常比你快'); continue }
    if (group === 'normally travels slower than you') { bits.push('通常比你慢'); continue }
    for (const bit of group.split(', ')) {
      const energy = /^(attack|shoot|travel|swim|pray|magic): (\d+)%$/.exec(bit)
      if (!energy) return null
      bits.push(`${ENERGY_NAMES[energy[1]]}：${energy[2]}%`)
    }
  }
  return bits.length ? `速度：${m[1]}%（${bits.join('，')}）` : `速度：${m[1]}%`
}

// --- attack table ----------------------------------------------------------

type ColumnKind = 'attack' | 'damage' | 'range' | 'bonus'

interface TableColumn {
  /** Column start in the untranslated row (used to slice cells). */
  orig: number
  /** Column start after the translated header (used to lay cells out). */
  start: number
  kind: ColumnKind
}

const HEADER_RE = /^(Attacks?)\s{2,}(Max Damage)(?:\s{2,}(Range))?(?:\s{2,}(After Damaging Hits|Bonus))?\s*$/

const HEADER_ZH: Record<string, string> = {
  Attack: '攻击',
  Attacks: '攻击方式',
  'Max Damage': '最大伤害',
  Range: '射程',
  'After Damaging Hits': '命中后效果',
  Bonus: '附伤',
}

function parseAttackHeader(line: string): { words: string[]; starts: number[] } | null {
  const m = HEADER_RE.exec(line)
  if (!m) return null
  const words = [m[1], m[2], m[3], m[4]].filter((w): w is string => Boolean(w))
  const starts: number[] = []
  let pos = 0
  for (const word of words) {
    const at = line.indexOf(word, pos)
    starts.push(at)
    pos = at + word.length
  }
  return { words, starts }
}

function columnKind(word: string): ColumnKind {
  if (word === 'Range') return 'range'
  if (word === 'After Damaging Hits' || word === 'Bonus') return 'bonus'
  if (word === 'Max Damage') return 'damage'
  return 'attack'
}

function layoutCells(cells: string[], starts: number[], minGap = 3): string {
  let out = ''
  let cursor = 0
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i]
    if (cell === '') continue
    const target = Math.max(starts[i] ?? cursor + minGap, i === 0 ? 0 : cursor + minGap)
    if (i > 0 || target > cursor) out += ' '.repeat(target - cursor)
    out += cell
    cursor = target + displayWidth(cell)
  }
  return out
}

function translateAttackCell(cell: string): string | null {
  if (!cell) return ''
  const throwMatch = /^Throw: (.+)$/.exec(cell)
  if (throwMatch) {
    const items = tItem(throwMatch[1])
    if (items === throwMatch[1] && /[A-Za-z]{3,}/.test(items)) return null
    return `投掷：${items}`
  }
  const multi = /^(\d+x) (.+?)(?:: (.+))?$/.exec(cell)
  if (multi) {
    const name = ATTACK_NAMES[multi[2].toLowerCase()]
    if (!name) return null
    if (!multi[3]) return `${multi[1]} ${name}`
    const extra = translateAttackExtra(multi[3])
    return extra ? `${multi[1]} ${name}：${extra}` : null
  }
  const single = /^(.+?)(?:: (.+))?$/.exec(cell)
  if (!single) return null
  const name = ATTACK_NAMES[single[1].toLowerCase()]
  if (!name) return null
  if (!single[2]) return name
  const extra = translateAttackExtra(single[2])
  return extra ? `${name}：${extra}` : null
}

function translateAttackExtra(extra: string): string | null {
  if (/^[+-]?\d+/.test(extra)) {
    const item = tItem(extra)
    return item !== extra ? item : null
  }
  return BRAND_NAMES[extra.toLowerCase()] ?? null
}

function translateDamageCell(cell: string): string | null {
  if (!cell) return ''
  let text = cell
  let each = false
  if (text.endsWith(' each')) {
    each = true
    text = text.slice(0, -' each'.length)
  }
  const parts = text.split(' + ')
  const out: string[] = []
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (i === 0) {
      const base = /^(\d+)(?: \((base \d+|curare|fire)\))?$/.exec(part)
      const fire = /^(\d+) (fire)$/.exec(part)
      if (fire) out.push(`${fire[1]}（火焰）`)
      else if (!base) return null
      else if (!base[2]) out.push(base[1])
      else if (base[2] === 'curare') out.push(`${base[1]}（箭毒）`)
      else if (base[2] === 'fire') out.push(`${base[1]}（火焰）`)
      else out.push(`${base[1]}（基础 ${base[2].slice(5)}）`)
      continue
    }
    const brand = /^(\d+) \((.+)\)$/.exec(part)
    if (brand) {
      const name = BRAND_NAMES[brand[2].toLowerCase()]
      if (!name) return null
      out.push(`${brand[1]}（${name}）`)
      continue
    }
    const per = /^(\d+) per (\d+) attacks$/.exec(part)
    if (per) {
      out.push(`每 ${per[2]} 次攻击 ${per[1]}`)
      continue
    }
    const bare = BRAND_NAMES[part.toLowerCase()]
    if (bare) {
      out.push(bare)
      continue
    }
    return null
  }
  const joined = out.join(' + ')
  return each ? `每次 ${joined}` : joined
}

function translateRangeCell(cell: string): string | null {
  if (!cell) return ''
  const m = /^(\d*)(?: ?\(Cleave\))?$/.exec(cell)
  if (!m) return null
  const n = m[1] || ''
  if (/\(Cleave\)$/.test(cell)) return n ? `${n}（横扫）` : '（横扫）'
  return n
}

/** Put a parenthetical after the first co-ordinated clause ("毒素（最大 3）与短暂麻痹"). */
function withSuffix(zh: string, suffix: string): string {
  if (!suffix) return zh
  const at = zh.search(/[与和]/)
  return at > 0 ? zh.slice(0, at) + suffix + zh.slice(at) : zh + suffix
}

function translateBonusCell(cell: string): string | null {
  if (!cell) return ''
  const parts = cell.split(' + ')
  const out: string[] = []
  for (const part of parts) {
    let base = part
    let suffix = ''
    // (max N), (max N each), (max N damage) — the engine can also insert the
    // marker mid-phrase for minipara ("Poison (max 3) and momentary paralysis").
    const max = / \(max (\d+)(?: (each|damage))?\)/.exec(base)
    if (max) {
      suffix = max[2] === 'each' ? `（每次最大 ${max[1]}）` : `（最大 ${max[1]}）`
      base = base.slice(0, max.index) + base.slice(max.index + max[0].length)
    } else {
      const dam = / \((\d+)-(\d+) dam\)/.exec(base)
      if (dam) {
        suffix = `（${dam[1]}-${dam[2]} 伤害）`
        base = base.slice(0, dam.index) + base.slice(dam.index + dam[0].length)
      }
    }
    if (base.endsWith(' (if damage dealt)')) {
      suffix += '（若造成伤害）'
      base = base.slice(0, -' (if damage dealt)'.length)
    }
    const zh = BONUS_NAMES[lowerFirst(base)] ?? BONUS_NAMES[base.toLowerCase()]
    if (!zh) return null
    out.push(withSuffix(zh, suffix))
  }
  return out.join(' + ')
}

function translateAttackRow(line: string, cols: TableColumn[]): string | null {
  const cells: string[] = []
  for (let i = 0; i < cols.length; i++) {
    const end = i + 1 < cols.length ? cols[i + 1].orig : line.length
    cells.push(line.slice(cols[i].orig, end).trim())
  }
  const translated: string[] = []
  for (let i = 0; i < cols.length; i++) {
    const kind = cols[i].kind
    const cell = kind === 'attack' ? translateAttackCell(cells[i])
      : kind === 'damage' ? translateDamageCell(cells[i])
      : kind === 'range' ? translateRangeCell(cells[i])
      : translateBonusCell(cells[i])
    if (cell === null) return null
    translated.push(cell)
  }
  return layoutCells(translated, cols.map((c) => c.start))
}

// --- status / quote --------------------------------------------------------

// A block starts at a tag line ("<white>Asleep:"), not at a blank line: the
// engine turns every newline inside a body into "\n   ", so a paragraph break
// reads "\n   \n   …" and splitting on whitespace-only lines would tear a
// multi-paragraph status in half, leaving the tail English.
const STATUS_BREAK = /\n[ \t]*\n(?=(?:<[^>]+>)*[A-Za-z][^<:\n]{0,39}:)/

/**
 * `status` arrives as `<white>Tag:<lightgrey>\n   body` blocks. Translate the
 * tag through the dictionary and take the body from monstatus.txt, which is
 * keyed by the same tag. Unknown tags keep the whole English block.
 */
export function translateMonsterStatus(text: string): string {
  if (!isZh() || !text) return text
  const blocks = text.split(STATUS_BREAK)
  return blocks.map((block) => {
    const m = /^((?:<[^>]+>)*)[ \t]*([^<:\n]{1,40}?):((?:<[^>]+>)*)[ \t]*\n?([\s\S]*)$/.exec(block)
    if (!m) return block
    const tag = m[2].trim()
    const body = lookupMonsterStatus(tag)
    const label = t(tag.toLowerCase())
    // No localized body or no label: keep the whole English block.
    if (!body || label === tag.toLowerCase()) return block
    // Keep the engine's 3-space indent so the body renders as one block and
    // its paragraph breaks ("\n\n") survive as breaks.
    const lines = body.replace(/\r\n/g, '\n').trim().split('\n')
      .map((line) => (line.trim() ? `   ${line}` : ''))
    return `${m[1]}${label}：${m[3]}\n${lines.join('\n')}`
  }).join('\n\n')
}

/** The Quote: section, keyed by the English quote text in quotes.txt. */
export function translateMonsterQuote(text: string): string {
  if (!isZh() || !text) return text
  return lookupProse(text) ?? text
}

// --- generic panel sentences ----------------------------------------------

function translateResistLine(line: string): string | null {
  const m = /^(It|They|He|She) (?:is|are) (.+)\.$/.exec(line)
  if (!m) return null
  const p = PRONOUN[m[1]]
  // One sentence can carry several levels: "It is immune to fire, cold; and
  // very resistant to poison; susceptible to silver." Split on the clause
  // separators, never on the comma inside a single list.
  const clauses = m[2].split(/;\s*(?:and\s+)?/)
  if (clauses.some((c) => !/^(?:immune to|very resistant to|resistant to|susceptible to) /.test(c))) {
    return null
  }
  const parts: string[] = []
  for (const clause of clauses) {
    const d = /^(immune to|very resistant to|resistant to|susceptible to) (.+)$/.exec(clause)
    if (!d) return null
    const raw = d[2].split(/\s*(?:,\s*(?:and\s+)?|\s+and\s+)\s*/).filter(Boolean)
    const items = raw.map((x) => DAMAGE_NAMES[x.toLowerCase()])
    if (items.some((x) => !x)) return null
    const list = zhList(items as string[])
    switch (d[1]) {
      case 'immune to': parts.push(`免疫${list}`); break
      case 'very resistant to': parts.push(`对${list}有极强抗性`); break
      case 'resistant to': parts.push(`抗${list}`); break
      default: parts.push(`易受${list}伤害`)
    }
  }
  return `${p}${parts.join('；')}。`
}

function translateMonsterSentence(line: string): string | null {
  const pron = /^(It|They|He|She)\b/.exec(line)
  const p = pron ? PRONOUN[pron[1]] : null

  const struck = /^If struck, (it|they|he|she) will (?:crumble away|die) soon after\.$/.exec(line)
  if (struck) {
    const self = { it: '它', they: '它们', he: '他', she: '她' }[struck[1]] ?? '它'
    return /crumble away/.test(line)
      ? `若被击中，${self}很快会崩解。`
      : `若被击中，${self}很快会死亡。`
  }

  if (p) {
    const simple: Array<[RegExp, string]> = [
      [/^(?:It|They|He|She) (?:is|are) incapable of using stairs\.$/, `${p}无法使用楼梯。`],
      [/^(?:It|They|He|She) (?:is|are) stationary\.$/, `${p}无法移动。`],
      [/^(?:It|They|He|She) (?:is|are) a demon\.$/, `${p}是恶魔。`],
      [/^(?:It|They|He|She) (?:is|are) quickly melting away\.$/, `${p}正在迅速融化。`],
      [/^(?:It|They|He|She) (?:is|are) quickly crumbling away\.$/, `${p}正在迅速崩解。`],
      [/^(?:It|They|He|She) (?:is|are) quickly withering away\.$/, `${p}正在迅速枯萎。`],
      [/^(?:It|They|He|She) will release all of its jellies when polymorphed\.$/, `${p}被变形时会释放所有果冻。`],
      [/^(?:It|They|He|She) (?:is|are) cold-blooded and may be slowed by cold attacks\.$/, `${p}是冷血动物，可能被寒冷攻击减速。`],
      [/^(?:It|They|He|She) can see invisible\.$/, `${p}能看见隐形。`],
      [/^(?:It|They|He|She) can burrow through diggable terrain\.$/, `${p}能钻过可挖掘的地形。`],
      [/^(?:It|They|He|She) can use ranged and thrown weapons in melee range\.$/, `${p}能在近战范围内使用远程和投掷武器。`],
      [/^(?:It|They|He|She) (?:is|are) insubstantial and immune to ensnarement\.$/, `${p}是虚体的，免疫束缚。`],
      [/^(?:It|They|He|She) (?:is|are) amorphous and immune to ensnarement\.$/, `${p}是无定形的，免疫束缚。`],
      [/^(?:It|They|He|She) covers ground more quickly when invisible\.$/, `${p}隐身时移动更快。`],
      [/^(?:It|They|He|She) can fly\.$/, `${p}能飞行。`],
      [/^(?:It|They|He|She) can travel through water\.$/, `${p}能在水中移动。`],
      [/^(?:It|They|He|She) can walk on water\.$/, `${p}能在水面上行走。`],
      [/^(?:It|They|He|She) can travel through lava\.$/, `${p}能在岩浆中移动。`],
      [/^(?:It|They|He|She) can open doors\.$/, `${p}能打开门。`],
      [/^(?:It|They|He|She) can crash through doors\.$/, `${p}能撞破门。`],
      [/^(?:It|They|He|She) can eat doors\.$/, `${p}能吃掉门。`],
      [/^(?:It|They|He|She) cannot move\.$/, `${p}无法移动。`],
      [/^(?:It|They|He|She) (?:is|are) currently invisible to you and you have merely inferred .*$/, `${p}目前对你隐形，你只能推断出它的位置；你无法得知它当前的生命与状态，且你对它攻击的命中与防御都会下降。`],
      [/^(?:It|They|He|She) (?:is|are) currently invisible to you and its true position is unknown.*$/, `${p}目前对你隐形，真实位置未知，但你上次看到它就在这里。`],
      [/^(?:It|They|He|She) cannot be affected by reciting Zin's laws\.$/, `${p}不受诵读辛之律法影响。`],
      [/^(?:It|They|He|She) (?:is|are) too strong to be affected by reciting Zin's laws\.$/, `${p}太强大，不受诵读辛之律法影响。`],
      [/^(?:It|They|He|She) can be affected by reciting Zin's laws\.$/, `${p}受诵读辛之律法影响。`],
      [/^Despite (?:its|their|his|her) appearance, (?:it|they|he|she) can open doors\.$/, `尽管外表如此，${p}仍能打开门。`],
    ]
    for (const [re, out] of simple) if (re.test(line)) return out

    const vuln = /^(It|They|He|She) (?:is|are) vulnerable to (.+) and hated by (.+)\.$/.exec(line)
    if (vuln) {
      const a = DAMAGE_NAMES[vuln[2].toLowerCase()]
      const b = t(vuln[3])
      if (!a || b === vuln[3]) return null
      return `${p}惧怕${a}，并被${b}厌恶。`
    }
    const curse = /^(It|They|He|She) will inflict a (powerful )?necromantic curse on (?:its|their|his|her) foe when destroyed\.$/.exec(line)
    if (curse) return `${p}被摧毁时会对敌人施加${curse[1] ? '强大的' : ''}死灵诅咒。`
    const acid = /^(It|They|He|She) (?:inflicts|inflict) (\d+d\d+) (.+?) damage when struck in melee\.$/.exec(line)
    if (acid) {
      const kind = DAMAGE_NAMES[acid[3].toLowerCase()]
      if (!kind) return null
      return `近战被击中时会造成 ${acid[2]} 点${kind}伤害。`
    }
    const deals = /^(It|They|He|She) deals (\d+d\d+) (.+?) damage( when destroyed)?\.$/.exec(line)
    if (deals) {
      const kind = DAMAGE_NAMES[deals[3].toLowerCase()]
      if (!kind) return null
      return `${p}${deals[4] ? '被摧毁时' : ''}会造成 ${deals[2]} 点${kind}伤害。`
    }
    const dealsPlain = /^(It|They|He|She) deals (\d+d\d+) damage( when destroyed)?\.$/.exec(line)
    if (dealsPlain) {
      return `${p}${dealsPlain[3] ? '被摧毁时' : ''}会造成 ${dealsPlain[2]} 点伤害。`
    }
  }

  // Summoned monsters: assembled from fixed fragments.
  const summon = /^This monster has been (temporarily summoned to this location|created by magic and is temporary)\. (?:If angered it will immediately vanish, yielding |Killing it yields )no experience or items(; it is incapable of using stairs)?\.$/.exec(line)
  if (summon) {
    const kind = summon[1].startsWith('temporarily')
      ? '此怪物是被临时召唤到这里的'
      : '此怪物由魔法创造，是临时的'
    const angered = line.includes('If angered')
    const reward = angered ? '若被激怒，它会立即消失，不提供经验或物品' : '击杀它不会获得经验或物品'
    return `${kind}。${reward}${summon[2] ? '；它无法使用楼梯' : ''}。`
  }

  // "It has an unusual item: a wand of fire."
  const unusual = /^(It|They|He|She) (?:has|have) an unusual item: (.+)\.$/.exec(line)
  if (unusual) {
    const items = unusual[2].split(/\s*,\s*and\s+|\s*,\s*|\s+and\s+/)
    const zh = items.map((x) => tItem(x))
    if (zh.some((x, i) => x === items[i])) return null
    return `${PRONOUN[unusual[1]]}持有不寻常物品：${zhList(zh)}。`
  }
  const oddSelf = /^(It|They|He|She) (?:is|are) an unusual item\.$/.exec(line)
  if (oddSelf) return `${PRONOUN[oddSelf[1]]}是一件不寻常的物品。`

  // Zin's recite verdicts carry a wizard-mode suffix.
  const zinWizard = /^(It|They|He|She) (cannot be affected by reciting Zin's laws|(?:is|are) (?:too strong to be affected by reciting Zin's laws|can be affected by reciting Zin's laws))\. \(Recite power: (\d+), Hit dice: (\d+)\)$/.exec(line)
  if (zinWizard) {
    const what = zinWizard[2].startsWith('cannot')
      ? '不受诵读辛之律法影响'
      : zinWizard[2].includes('too strong') ? '太强大，不受诵读辛之律法影响' : '受诵读辛之律法影响'
    return `${PRONOUN[zinWizard[1]]}${what}（诵读威力：${zinWizard[3]}，生命骰：${zinWizard[4]}）。`
  }

  // The spell list footer (describe_spellset) is assembled with the dice /
  // Will / range legend; the dictionary key keeps a literal "\n" prefix, so
  // match it here instead.
  const spellFooter = /^To read a description, press the key listed above\.(.*)$/.exec(line)
  if (spellFooter) {
    const head = '要阅读描述，请按上方列出的按键。'
    const legend = ' (AdB) indicates damage (the sum of A B-sided dice), (x%) indicates the chance to defeat your Will, and (y) indicates the spell range'
    const tail = spellFooter[1]
    if (!tail) return head
    if (tail === `${legend}.`) {
      return `${head}(AdB) 表示伤害（A 个 B 面骰子之和），(x%) 表示穿透意志的几率，(y) 表示法术射程。`
    }
    if (tail === `${legend}; shown in red if you are in range.`) {
      return `${head}(AdB) 表示伤害（A 个 B 面骰子之和），(x%) 表示穿透意志的几率，(y) 表示法术射程；在射程内会显示为红色。`
    }
    return null
  }

  // Sentences that do not vary with the monster.
  const fixed: Record<string, string> = {
    'It will release varied jellies when damaged or killed, with the number of jellies proportional to the amount of damage.':
      '它在受伤或死亡时会释放不同种类的果冻，数量与伤害量成正比。',
    'Killing this monster yields no experience or items.':
      '击杀此怪物不会获得经验或物品。',
    'It looks just like you...spooky!': '它看起来和你一模一样……真吓人！',
    'This creature provides no experience or piety when slain.':
      '击杀此生物不会提供经验或虔诚。',
    'Melee attacks you make against this creature will deal greatly increased damage, especially if made with a short blade.':
      '你对这个生物发动的近战攻击会造成大幅提高的伤害，尤其是使用短刃时。',
  }
  return fixed[line] ?? null
}

export function translateMonsterLine(line: string): string | null {
  if (!isZh() || !line) return null
  const plain = line.replace(/<[^>]*>/g, '')
  const idx = plain ? line.indexOf(plain) : -1
  const leading = idx > 0 ? line.slice(0, idx) : ''
  const out = translateHitLine(plain)
    ?? translateMonsToHitYou(plain)
    ?? translateNoticeLine(plain)
    ?? translateSpeedLine(plain)
    ?? translateDraconian(plain)
    ?? translateResistLine(plain)
    ?? translateMonsterSentence(plain)
  if (out === null) return null
  return leading + out
}

export function translateMonsterBody(body: string): string {
  if (!isZh() || !body) return body
  const lines = body.split('\n')
  const out: string[] = []
  let cols: TableColumn[] | null = null
  for (const line of lines) {
    const plain = line.replace(/<[^>]*>/g, '')
    const header = parseAttackHeader(plain)
    if (header) {
      const cells = header.words.map((w) => HEADER_ZH[w] ?? w)
      // Place translated headers at their original columns, widening only when
      // a translation overflows into the next column.
      const starts: number[] = []
      let cursor = 0
      for (let i = 0; i < cells.length; i++) {
        const target = Math.max(header.starts[i], i === 0 ? 0 : cursor + 3)
        starts.push(target)
        cursor = target + displayWidth(cells[i])
      }
      out.push(layoutCells(cells, starts))
      cols = header.words.map((w, i) => ({
        orig: header.starts[i],
        start: starts[i],
        kind: columnKind(w),
      }))
      continue
    }
    if (cols) {
      if (!plain.trim()) {
        cols = null
        out.push(line)
        continue
      }
      const row = translateAttackRow(plain, cols)
      // Unknown row: keep the English row, keep scanning the rest.
      out.push(row ?? line)
      continue
    }
    const single = translateMonsterLine(line)
    out.push(single ?? line)
  }
  return translateBody(out.join('\n'))
}
