// Item-name grammar.
//
// The engine composes names from fragments ("+1", "dagger", "of venom",
// "potion", "worn") and Chinese needs a different order and measure. This is a
// small, deliberately conservative rule set: it only produces a name when every
// piece is known, otherwise the caller keeps the English one.
//
//   +1 dagger of venom   -> 淬毒的+1匕首
//   2 black potions      -> 黑色药水 x2
//   a +0 robe (worn)     -> 布袍（已穿戴）
//   the +2 ring of protection -> +2防护之戒

import type { Matcher } from './translate'
import { featureName } from './names-zh'

const ARTICLES = /^(?:a|an|the)\s+/i
const HOTKEY_PREFIX = /^(\s*(?:\([^)]\)|[A-Za-z0-9*!?])\s+[-+#$]\s+)/
const LEADING_PLUS = /^([+-]\d+)\s+/
const LEADING_QTY = /^(\d+)\s+/
const TRAILING_PAREN = /\s*\(([^()]*(?:\([^()]*\)[^()]*)*)\)\s*$/

const ADJECTIVES: Record<string, string> = {
  black: '黑色', white: '白色', red: '红色', blue: '蓝色', green: '绿色',
  yellow: '黄色', orange: '橙色', purple: '紫色', pink: '粉色', brown: '棕色',
  grey: '灰色', gray: '灰色', gold: '金色', silver: '银色', cyan: '青色',
  magenta: '洋红', clear: '无色', glowing: '发光的', runed: '刻纹的',
  smoky: '烟熏的', dark: '深色', scratched: '磨损的', embroidered: '绣花的',
  engraved: '雕刻的', ornate: '华丽的', polished: '抛光的', dull: '暗淡的',
  wobbling: '摇晃的', humming: '嗡鸣的', buzzing: '嗡鸣的', carved: '雕刻的',
  burnt: '烧焦的', twisted: '扭曲的', gnarled: '多节的', chipped: '缺口的',
  cracked: '裂开的', dented: '凹陷的', scorched: '焦黑的', stained: '沾污的',
  tattered: '破烂的', frayed: '磨破的', shimmering: '微光的', sparkling: '闪光的',
  encrusted: '镶嵌的', gilded: '镀金的', moldy: '发霉的', slimy: '黏滑的',
  // Jewellery/random-item qualifiers (item-name.cc ring/amulet/potion tables).
  tubular: '管状的', blackened: '熏黑的', shiny: '闪亮的', notched: '带缺口的',
  knobbly: '多节的', square: '方形的', thick: '厚重', thin: '薄', tiny: '微小',
  triangular: '三角形的', lumpy: '疙瘩的', bubbling: '冒泡的', fuming: '冒烟的',
  fizzy: '起泡的', viscous: '黏稠的', sedimented: '有沉淀的', metallic: '金属的',
  murky: '浑浊的', gluggy: '黏糊的', oily: '油滑的', emulsified: '乳化的',
  silvery: '银色的', inky: '墨色的', ruby: '红宝石色的', emerald: '翠绿的',
  coppery: '铜色的', golden: '金色的', puce: '紫褐色的', amethyst: '紫水晶色的',
  sapphire: '蓝宝石色的', wooden: '木制的', brass: '黄铜', copper: '铜',
  granite: '花岗岩', ivory: '象牙', marble: '大理石', glass: '玻璃',
  agate: '玛瑙', bone: '骨', diamond: '钻石', peridot: '橄榄石', garnet: '石榴石',
  opal: '蛋白石', pearl: '珍珠', coral: '珊瑚', cabochon: '蛋面', onyx: '缟玛瑙',
  moonstone: '月光石', tourmaline: '电气石', jade: '玉',
  // Weapon/armour random qualifiers and materials (item-name.cc).
  jewelled: '镶宝的', curved: '弯曲的', long: '长', short: '短', crooked: '歪曲的',
  forked: '分叉的', tapered: '锥形的', worn: '破旧的', weird: '怪异的',
  smoking: '冒烟的', iron: '铁', lead: '铅', fluorescent: '荧光的',
  bronze: '青铜', platinum: '铂金', zirconium: '锆石',
  citrine: '黄水晶', cameo: '浮雕', jasper: '碧玉', malachite: '孔雀石',
  soapstone: '皂石', filigree: '金银丝', beryl: '绿柱石',
  large: '大', small: '小', heavy: '沉重', light: '轻便',
}

const SUFFIXES: Record<string, string> = {
  'of venom': '淬毒',
  'of infusion': '灌注',
  'of speed': '急速',
  'of flame': '烈焰',
  'of fire': '火焰',
  'of frost': '冰霜',
  'of cold': '寒冷',
  'of freezing': '冰冻',
  'of attraction': '吸引',
  'of mutation': '变异',
  'of curing': '治愈',
  'of heal wounds': '疗伤',
  'of haste': '急速',
  'of might': '力量',
  'of brilliance': '才智',
  'of invisibility': '隐身',
  'of resistance': '抗性',
  'of cancellation': '解除',
  'of lignification': '木化',
  'of noise': '噪音',
  'of teleportation': '传送',
  'of blinking': '闪烁',
  'of silence': '沉默',
  'of summoning': '召唤',
  'of vulnerability': '脆弱',
  'of immolation': '自焚',
  'of magic mapping': '魔法地图',
  'of identify': '鉴定',
  'of brand weapon': '武器附魔',
  'of enchant armour': '强化护甲',
  'of enchant weapon': '强化武器',
  'of slaying': '屠戮',
  'of strength': '力量',
  'of intelligence': '智力',
  'of dexterity': '敏捷',
  'of flaming': '烈焰',
  'of electrocution': '电击',
  'of draining': '汲取',
  'of holy wrath': '神圣之怒',
  'of pain': '痛苦',
  'of antimagic': '反魔法',
  'of vampirism': '吸血',
  'of heavy': '沉重',
  'of spectral': '幽灵',
  'of penetration': '穿透',
  'of reaping': '收割',
  'of chaos': '混沌',
  'of distortion': '扭曲',
  'of protection': '防护',
  'of evasion': '闪避',
  'of fire resistance': '抗火',
  'of cold resistance': '抗寒',
  'of poison resistance': '抗毒',
  'of electricity resistance': '抗电',
  'of corrosion resistance': '抗腐蚀',
  'of willpower': '意志',
  'of spirit shield': '灵盾',
  'of regeneration': '再生',
  'of magic resistance': '抗魔',
  'of clarity': '清晰',
  'of sustain attributes': '维持属性',
  'of reflection': '反射',
  'of guardian spirit': '守护之灵',
  'of faith': '信仰',
  'of acrobatics': '杂技',
  'of the acrobat': '杂技',
  'of wizardry': '法术',
  'of the magpie': '喜鹊',
  'of the wild': '野性',
  'of stasis': '锁定',
  'of ponderousness': '沉重',
  'of the tortoise': '龟甲',
  'of the dragon': '龙力',
  'of the bear spirit': '熊灵',
  'of harm': '伤害',
  'of the storm': '风暴',
  'of the cloud': '云雾',
  'of the ram': '冲撞',
  'of the castle': '城堡',
  'of the octopus': '章鱼',
  'of the sphinx': '斯芬克斯',
}

const PROP_BASE: Record<string, string> = {
  rF: '火抗', rC: '冰抗', rPois: '毒抗', rN: '负能抗', rElec: '电抗', rCorr: '腐蚀抗',
  Str: '力量', Int: '智力', Dex: '敏捷', MP: '法力', HP: '生命', AC: '护甲',
  EV: '闪避', SH: '格挡', Slay: '屠戮', Will: '意志', Stlth: '潜行', Regen: '再生',
}

/** "rF+" → 火抗+, "Str-1" → 力量-1, unknown tokens stay verbatim. */
const PROP_LABELS: Record<string, string> = {
  '*Rats': '鼠群', '*Silence': '沉默', '*Corrode': '腐蚀', '*Contam': '污染',
  '*Drain': '汲取', '*Slow': '迟缓', '*Noise': '噪音', '*Tele': '传送',
  Ponderous: '笨重',
  Forge: '锻造', Stlth: '潜行', Arm: '护甲', Dodg: '闪避', Tloc: '传送',
  Shape: '变形', Melee: '近战', Range: '远程', Evo: '释放', Conj: '咒法',
  Alch: '炼金', Summ: '召唤', Necro: '死灵', Hex: '诅咒',
  Ice: '冰系', Fire: '火系', Air: '气系', Earth: '土系', Poison: '毒系',
  'one-handed': '单手', 'two-handed': '双手',
  draining: '汲取', 'holy wrath': '神圣之怒', flaming: '烈焰',
  freezing: '冰冻', electrocution: '电击', venom: '淬毒',
  distortion: '扭曲', chaos: '混沌', vamp: '吸血', vampirism: '吸血',
  antimagic: '反魔法', pain: '痛苦', heavy: '沉重', spectral: '幽灵',
  speed: '急速', flame: '烈焰', freeze: '冰冻', drain: '汲取',
  Harm: '伤害', Death: '死亡',
}

/** Label of a property row: "rPois" → 毒抗, "*Rats" → 鼠群, "MP+10" → 法力+10. */
export function propLabel(label: string): string {
  return PROP_LABELS[label] ?? propToken(label)
}

export function propToken(tok: string): string {
  const m = /^(rF|rC|rPois|rN|rElec|rCorr|Str|Int|Dex|MP|HP|AC|EV|SH|Slay|Will|Stlth|Regen)([+-]?\d*)$/.exec(tok)
  if (!m) return tok
  return PROP_BASE[m[1]] + (m[2] ?? '')
}

const PARENS: Record<string, string> = {  worn: '已穿戴',
  cursed: '被诅咒',
  melded: '已融合',
  'in inventory': '在背包中',
  removed: '已取下',
  wielded: '已持握',
  weapon: '武器',
  armour: '护甲',
  jewellery: '首饰',
  missile: '投掷物',
  book: '书',
  potion: '药水',
  wand: '魔杖',
  staff: '法杖',
  speed: '急速',
  freeze: '冰冻',
  flame: '烈焰',
  elec: '电击',
  frost: '寒霜',
  venom: '淬毒',
  protection: '防护',
  evasion: '闪避',
  might: '力量',
}

function singular(w: string): string {
  if (/(?:ch|sh|ss|x|z)es$/.test(w)) return w.replace(/es$/, '')
  if (/[^s]s$/.test(w)) return w.slice(0, -1)
  return w
}

/** Translate a run of words, longest dictionary phrase first. Returns null on a gap. */
function phrase(m: Matcher, words: string[]): string | null {
  if (words.length === 0) return ''
  const out: string[] = []
  let i = 0
  while (i < words.length) {
    let hit: string | null = null
    for (let n = Math.min(4, words.length - i); n >= 1; n--) {
      const chunk = words.slice(i, i + n).join(' ')
      const t = m.exact.get(chunk)
        ?? (n === 1 && chunk !== chunk.toLowerCase() ? m.exact.get(chunk.toLowerCase()) : undefined)
      if (t) {
        out.push(t)
        i += n
        hit = t
        break
      }
    }
    if (hit) continue
    const w = words[i]
    const lower = w.toLowerCase()
    const adj = ADJECTIVES[lower]
    const direct = m.exact.get(w)
    // Case-folding is only safe for words the engine already prints in lower
    // case ("kobolds"). Otherwise a capitalized UI word ("Collapsed") would
    // match an unrelated engine entry ("collapsed" = fell over).
    const single = direct ?? (w === lower ? m.exact.get(singular(lower)) : undefined)
    if (adj) out.push(adj)
    else if (single) out.push(single)
    else if (/^[+][0-9]+$/.test(w) || /^[-–—]$/.test(w)) out.push(w)
    // Unknown qualifier ("calcified"): still fail rather than silently drop
    // information. Known adjectives are listed above; add new ones there.
    else return null
    i++
  }
  return out.join('')
}

/**
 * Last-resort item name: keep known words translated and quarantine unknown
 * qualifiers in parentheses ("（flibbertigibbet）小装置"). Only used when the
 * final noun itself is known, so the player still sees what the item is.
 */
function loosePhrase(m: Matcher, words: string[]): string | null {
  if (words.length < 2) return null
  // Engine dictionary keys include bare articles and prepositions ("a" is
  // 一阵, and plurals collapse "as" → "a"). They can never be an item
  // qualifier, so never let them swallow a word here.
  const STOP = new Set([
    'a', 'an', 'the', 'and', 'or', 'as', 'of', 'to', 'for', 'in', 'on', 'at',
    'by', 'with', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'it', 'its',
  ])
  const known = (w: string): string | undefined => {
    const lower = w.toLowerCase()
    if (w.length < 2 || STOP.has(lower)) return undefined
    return ADJECTIVES[lower]
      ?? m.exact.get(w)
      ?? (w === lower ? m.exact.get(singular(lower)) : undefined)
  }
  if (!known(words[words.length - 1])) return null
  let out = ''
  for (const w of words) {
    const hit = known(w)
    out += hit ?? `（${w}）`
  }
  return out
}

export interface ItemParts {
  hotkey: string
  plus: string
  qty: number
  body: string
  paren: string
}

/** Split a name into its mechanical pieces without translating anything. */
export function splitItem(raw: string): ItemParts {
  let rest = raw.trim().replace(/[.。]$/, '')
  const hotkey = HOTKEY_PREFIX.exec(rest)?.[1] ?? ''
  if (hotkey) rest = rest.slice(hotkey.length)
  let paren = ''
  const p = TRAILING_PAREN.exec(rest)
  if (p) {
    paren = p[1]
    rest = rest.slice(0, p.index)
  }
  rest = rest.replace(ARTICLES, '')
  let qty = 0
  const q = LEADING_QTY.exec(rest)
  if (q && !/^\d+\s*$/.test(rest)) {
    qty = Number(q[1])
    rest = rest.slice(q[0].length)
  }
  let plus = ''
  const pl = LEADING_PLUS.exec(rest)
  if (pl) {
    plus = pl[1]
    rest = rest.slice(pl[0].length)
  }
  return { hotkey, plus, qty, body: rest.trim().replace(/[.。]$/, ''), paren }
}

/**
 * Translate an item name. Returns null when any piece is unknown, so callers
 * can keep the English name rather than print a half-translated one.
 */
export function translateItem(m: Matcher, raw: string, opts?: { loose?: boolean }): string | null {
  if (!raw || !/[A-Za-z]/.test(raw)) return null
  const unknownPotion = raw.trim().replace(/^\s*(?:\([^)]\)|[A-Za-z0-9*!?])\s+[-+#$]\s+/, '').replace(/^(?:a|an|the)\s+/i, '').replace(/[.。]$/, '')
  if (/^unlabelled flask containing a single dose of unknown liquid$/i.test(unknownPotion)) {
    const prefix = HOTKEY_PREFIX.exec(raw)?.[1] ?? ''
    return `${prefix}一瓶成分不明的药水`
  }
  const magicPotion = raw.trim().replace(/^\s*(?:\([^)]\)|[A-Za-z0-9*!?])\s+[-+#$]\s+/, '').replace(/^(?:a|an|the)\s+/i, '').replace(/[.。]$/, '')
  if (/^potion of magic(?:\s*\(magic\))?$/i.test(magicPotion)) {
    const prefix = /^\s*((?:\([^)]\)|[A-Za-z0-9*!?])\s+[-+#$]\s+)/.exec(raw)?.[1] ?? ''
    return `${prefix}魔法药水${/\(magic\)/i.test(magicPotion) ? '（魔法）' : ''}`
  }
  const row = /^\s*((?:\([^)]\)|[A-Za-z0-9*!?])\s+[-+#$]\s+)(.*)$/.exec(raw)
  const originalHotkey = row?.[1] ?? ''
  const source = row?.[2] ?? raw
  const priceBeforeHotkey = /^(\d+)\s+gold(?:\s+pieces)?\s+((?:a|an|the)\s+)?(.+)$/i.exec(source.trim())
  if (priceBeforeHotkey) {
    const unknown = /\s+\(unknown\)$/i.test(priceBeforeHotkey[3])
    const name = `${priceBeforeHotkey[2] ?? ''}${priceBeforeHotkey[3]}`.replace(/\s+\(unknown\)$/i, '').replace(/[.。]$/, '')
    const item = translateItem(m, name, opts)
    if (item) return `${originalHotkey}${item}${unknown ? '（未知）' : ''}（${priceBeforeHotkey[1]} 金币）`
  }
  const priceFirstShop = /^(\d+)\s+gold(?:\s+pieces)?\s+((?:a|an|the)\s+)?(.+)$/i.exec(raw.trim())
  if (priceFirstShop) {
    const unknown = /\s+\(unknown\)$/i.test(priceFirstShop[3])
    const name = `${priceFirstShop[2] ?? ''}${priceFirstShop[3]}`.replace(/\s+\(unknown\)$/i, '').replace(/[.。]$/, '')
    const item = translateItem(m, name, opts)
    if (item) return `${item}${unknown ? '（未知）' : ''}（${priceFirstShop[1]} 金币）`
  }
  const priceQuantityBeforeHotkey = /^(\d+)\s+gold(?:\s+pieces)?\s+(\d+)\s+(.+)$/i.exec(source.trim())
  if (priceQuantityBeforeHotkey) {
    const unknown = /\s+\(unknown\)$/i.test(priceQuantityBeforeHotkey[3])
    const item = translateItem(m, `${priceQuantityBeforeHotkey[2]} ${priceQuantityBeforeHotkey[3].replace(/\s+\(unknown\)$/i, '')}`, opts)
    if (item) return `${originalHotkey}${item}${unknown ? '（未知）' : ''}（${priceQuantityBeforeHotkey[1]} 金币）`
  }
  // Reassignment rows: "s -> M - a potion of mutation".
  let prefix = ''
  const reassign = /^(\s*\S\s*->\s*\S\s+[-+#$]\s+)/.exec(raw)
  let text = raw
  if (reassign) {
    prefix = reassign[1]
    text = raw.slice(prefix.length)
  }
  const hotkey = (HOTKEY_PREFIX.exec(text)?.[1] ?? '') + ''
  // Dungeon features follow their own grammar ("a stone staircase leading down").
  const feat = featureName(text)
  if (feat && feat !== text) return prefix + feat
  const noHot = (hotkey ? text.slice(hotkey.length) : text).trim()
  const location = /^\[right here\]\s+(.+)$/.exec(noHot)
  if (location) {
    const item = translateItem(m, location[1], opts)
    if (item) return prefix + hotkey + '[就在这里] ' + item
  }
  // Several items on one line: "a +0 club; a stone" / "…; a rat corpse".
  if (noHot.includes(';')) {
    const parts = noHot.split(/\s*;\s*/).filter(Boolean)
    const zh = parts.map((p) => translateItem(m, p))
    if (zh.length > 1 && zh.every((z) => z !== null)) return prefix + zh.join('；')
  }
  // Whole-name hits first (articles included), then the grammar below.
  const bare = noHot.replace(ARTICLES, '')
  const cap = bare.charAt(0).toUpperCase() + bare.slice(1)
  const title = bare.replace(/\b[a-z]/g, (c) => c.toUpperCase())
  const direct = m.exact.get(noHot)
    ?? m.exact.get(bare)
    ?? m.exact.get(cap)
    ?? m.exact.get(title)
    // Single-word proper nouns often exist only in lower case ("fireball").
    ?? (bare.includes(' ') ? undefined : m.exact.get(bare.toLowerCase()))
  if (direct) return prefix + hotkey + direct

  // Shop rows put the price first: "202 gold a runed buckler". Handled before
  // splitItem, whose quantity rule would otherwise eat the number.
  const priceFirst = /^(\d+)\s+gold(?:\s+pieces)?[\s,;:]*((?:a|an|the)\s+)?(.+)$/i.exec(noHot)
  if (priceFirst) {
    const inner = translateItem(m, `${priceFirst[2] ?? ''}${priceFirst[3]}`.replace(/\s+\(unknown\)$/i, '').replace(/\.\s*$/, ''))
    if (inner) return hotkey + inner + `（${priceFirst[1]} 金币）`
  }

  const quantityFirst = /^(\d+)\s+gold(?:\s+pieces)?\s+(\d+)\s+(.+)$/i.exec(noHot)
  if (quantityFirst) {
    const rawItem = `${quantityFirst[2]} ${quantityFirst[3]}`
    const unknown = /\s+\(unknown\)$/i.test(rawItem)
    const inner = translateItem(m, rawItem.replace(/\s+\(unknown\)$/i, ''))
    if (inner) return `${hotkey}${inner}${unknown ? '（未知）' : ''}（${quantityFirst[1]} 金币）`
  }

  const parts = splitItem(text)
  if (!parts.body) return null

  // Unidentified shop stock carries `(unknown)` as a qualifier, not as part
  // of the item name. Preserve it while leaving the rest of the grammar strict.
  const unknown = /^(.*?)\s+\(unknown\)$/i.exec(parts.body)
  if (unknown) parts.body = unknown[1]

  // "scroll labelled PAMOANNURGHA": the noun is known, the label is a random
  // string the game prints as-is.
  const labelled = /^(.*?)\s+labelled\s+(.+)$/i.exec(parts.body)
  if (labelled) {
    const noun = phrase(m, labelled[1].split(/\s+/))
    if (!noun) return null
    const qty = parts.qty > 1 ? `×${parts.qty}` : ''
    return prefix + `${parts.hotkey}${parts.plus ? parts.plus : ''}${noun}（标签 ${labelled[2]}）${qty}`
  }

  // Artefact property braces: keep the token order, translate the known
  // abbreviations ("rF+ Str-1 MP+9"), leave anything else as-is.
  let propNote = ''
  const brace = /^(.*?)\s*(\{.*\})$/.exec(parts.body)
  let body = parts.body
  if (brace) {
    body = brace[1].trim()
    const inner = brace[2].replace(/^\{|\}$/g, '')
    // Tokens may be comma-separated ("Ponderous, Int+5, Forge"); keep the
    // separators so the brace reads the same after translation.
    const tokens = inner.split(/(,\s*|\s+)/).map((tok) => (/,|\s/.test(tok) ? tok : propLabel(tok)))
    propNote = ` {${tokens.join('')}}`
  }

  // "a pair of glowing boots" — the pair framing, not an ego suffix.
  const pair = /^(?:a |an )?pair of (.+)$/i.exec(body)
  if (pair) {
    const inner = translateItem(m, pair[1])
    if (inner) return prefix + parts.hotkey + `一双${inner}`
  }

  // "dagger of venom", "ring of protection and evasion"
  let base = body
  // Named artefacts: 'the ring "Voer"' → 「Voer」戒指.
  const quoted = /^(.*?)\s*"([^"]+)"(.*)$/.exec(body)
  let quothName = ''
  if (quoted) {
    quothName = quoted[2]
    base = `${quoted[1]} ${quoted[3]}`.trim()
  }
  let suffixZh = ''
  let suffixNote = ''
  const ofIdx = base.toLowerCase().indexOf(' of ')
  if (ofIdx > 0) {
    const suffixRaw = base.slice(ofIdx + 1)
    const suffix = suffixRaw.toLowerCase()
    base = base.slice(0, ofIdx)
    suffixZh = SUFFIXES[suffix] ?? ''
    if (!suffixZh) {
      // "of <spell/item name>": the name is in the engine dictionary
      // ("parchment of Call Canine Familiar").
      const rawName = suffixRaw.replace(/^of\s+/i, '')
      // Only proper names ("Call Canine Familiar"), never lower-case ego words
      // like "flaming" (that is a suffix, not a name).
      const named = /^[A-Z]/.test(rawName)
        ? (m.exact.get(rawName)
          ?? m.exact.get(rawName.charAt(0).toUpperCase() + rawName.slice(1))
          ?? m.exact.get(rawName.toLowerCase()))
        : undefined
      if (named) suffixZh = named
    }
    if (!suffixZh) {
      // "of A and B": try each side, else keep the proper name in parentheses
      const both = suffix.split(/\s+and\s+/)
      const keys = both.map((s) => s.startsWith('of ') ? s : `of ${s}`)
      if (keys.every((s) => SUFFIXES[s])) suffixZh = keys.map((s) => SUFFIXES[s]).join('与')
      // An unknown brand/spell name ("parchment of Volatile Blastmotes") stays
      // in its original spelling, but the noun around it is translated.
      else suffixNote = suffixRaw.replace(/^of\s+/i, '')
    }
  }

  const baseWords = base.split(/\s+/).filter(Boolean)
  const baseZh = phrase(m, baseWords) ?? (opts?.loose ? loosePhrase(m, baseWords) : null)
  if (!baseZh) return null

  // "+0" is noise in Chinese names (and every starting weapon has it).
  const plus = parts.plus && parts.plus !== '+0' ? parts.plus : ''
  let out = suffixZh ? `${suffixZh}的${plus}${baseZh}` : `${plus}${baseZh}`
  if (quothName) out += `「${quothName}」`
  if (!suffixZh && suffixNote) out += `（${suffixNote}）`
  if (parts.qty > 1) out += `×${parts.qty}`
  if (parts.paren) {
    const known = PARENS[parts.paren.toLowerCase()]
    // Nested qualifier: "Pondering (worn)" / "Lethargy (curse)".
    const nested = /^(.*?)\s*\((worn|curse|bound)\)$/i.exec(parts.paren)
    // Shop rows append the price: "(66 gold)" / "(66 gold pieces)"; pickup rows
    // append "(gained 1)".
    const price = /^(\d+)\s+gold(?:\s+pieces)?$/i.exec(parts.paren)
    const gained = /^gained\s+(\d+)$/i.exec(parts.paren)
    const brand = SUFFIXES[`of ${parts.paren.toLowerCase()}`]
      ?? m.exact.get(parts.paren)
    let inner = known ?? brand
      ?? (price ? `${price[1]} 金币`
        : gained ? `获得 ${gained[1]}`
          : /^\d+$/.test(parts.paren) ? parts.paren : '')
    if (!inner && nested) {
      const qual = { worn: '已穿戴', curse: '被诅咒', bound: '已束缚' }[nested[2].toLowerCase()] ?? nested[2]
      inner = `${translateItem(m, nested[1]) ?? nested[1]}（${qual}）`
    }
    if (inner) out += `（${inner}）`
    else if (!known) return null
  }
  if (unknown) out += '（未知）'
  return prefix + parts.hotkey + out + propNote
}
