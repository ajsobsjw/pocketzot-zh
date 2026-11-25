// Display-only localization for the `%` character overview screen
// (formatted-scroller tag "resists", crawl-ref/source/output.cc
// print_overview_screen) and shared player skill-title translation.
//
// Preserves all DCSS colour tags (<yellow>, <brown>, <green>, <darkgrey>, <w>,
// etc.) and keeps column alignment intact at phone width.

import { isZh, t, tItem } from './index'
import { translateStatusLight } from './status'
import { translateMutationName } from './mutations'

const SPECIES_ABBREV_ZH: Record<string, string> = {
  Hu: '人类', DE: '深精灵', Gn: '豺狼人', Mi: '牛头人', Mf: '人鱼',
  Gr: '石像鬼', Dj: '风精', Mu: '木乃伊', Vp: '吸血鬼', Ds: '恶魔裔',
  Tr: '巨魔', On: '鬼', Fe: '猫', Op: '章鱼', Sp: '树精', Te: '天狗',
  Na: '纳迦', Ba: '蛙人', Fo: '蚁人', VS: '藤蔓行者', MD: '山矮人',
  Ko: '狗头人', Co: '齿轮地精', Po: '骚灵', Re: '归来者', GC: '疾风半人马',
  Dr: '龙人', At: '甲马人',
}

const BG_ABBREV_ZH: Record<string, string> = {
  Fi: '战士', Gl: '角斗士', Mo: '武僧', Hu: '猎手', Br: '强盗',
  Be: '狂战士', CA: '灰烬侍僧', CK: '混沌骑士', Ar: '技师', Sh: '变形人',
  Wn: '漫游者', De: '挖掘者', Wr: '折跃者', Hs: '诅咒射手', En: '惑控师',
  Re: '掠夺者', HW: '杂学巫师', Cj: '咒法师', Su: '召唤师', Ne: '死灵法师',
  Fw: '锻造师', FE: '火元素使', IE: '冰元素使', AE: '气元素使', EE: '土元素使',
  Al: '炼金术士',
}

// Skill titles absent from zh.json (crawl-ref/source/skills.cc).
const EXTRA_PLAYER_TITLES_ZH: Record<string, string> = {
  Pugilist: '拳手',
  Cruiser: '巡游者',
  Feather: '轻羽',
  Middle: '中量级',
  Flawless: '无瑕者',
  'True Ascetic': '真苦行僧',
  Incurious: '淡泊者',
  Ruthless: '冷酷者',
  Miser: '吝啬鬼',
  'Chaos Fanatic': '混沌狂徒',
  'Keeper of the Flame': '守火者',
  'Pinnacle of Evolution': '进化巅峰',
  'Prickly Pangolin': '棘刺穿山甲',
  'Rolling Thunder': '滚雷',
  'Holy Roller': '圣滚者',
  'Petite Mort': '小死神',
  'Ex Machina': '机械降神',
  'Hundred Blades': '百刃',
  'Who Hides the Stars': '蔽星者',
  'Who Moves the Sun': '移日者',
  "Xom's Canvas": '佐姆的画布',
  'Unburdened By Reality': '超脱现实者',
  'Survivor of Endless Pranks': '无尽恶作剧幸存者',
}

const GOD_NAME_ZH: Record<string, string> = {
  'The Shining One': '光辉者',
  'the Shining One': '光辉者',
}

const SLOT_NAME_ZH: Record<string, string> = {
  weapon: '武器',
  offhand: '副手',
  shield: '盾牌',
  armour: '护甲',
  'body armour': '护甲',
  helmet: '头盔',
  hat: '帽子',
  headwear: '头饰',
  cloak: '斗篷',
  scarf: '围巾',
  gloves: '手套',
  boots: '靴子',
  footwear: '鞋靴',
  barding: '马铠',
  amulet: '护身符',
  ring: '戒指',
  talisman: '护符',
  orb: '宝珠',
  gizmo: '小装置',
  'auxiliary armour': '辅助护甲',
}

const UNARMED_ZH: Record<string, string> = {
  unarmed: '空手',
  'nothing wielded': '未持武器',
  claws: '利爪',
  'sharp claws': '利爪',
  'razor-sharp claws': '锋锐利爪',
  tentacles: '触手',
  fists: '拳头',
  punches: '拳击',
  kicks: '踢击',
  bites: '啃咬',
  hooves: '蹄击',
  'blade hands': '利刃之手',
  fangs: '利牙',
  tail: '尾击',
  paws: '爪击',
  pseudopods: '伪足',
}

const RESIST_LABEL_ZH: Record<string, string> = {
  rFire: '火抗',
  rCold: '冰抗',
  rNeg: '负能',
  rPois: '毒抗',
  rElec: '电抗',
  rCorr: '酸抗',
  SInv: '看破隐形',
  Will: '意志',
  Stlth: '潜行',
}

const PASSIVE_ZH: Record<string, string> = {
  'no passive effects': '无被动效果',
  'no teleportation': '无法传送',
  'no spellcasting': '无法施法',
  mayhem: '暴乱',
  'repel missiles': '排斥飞弹',
  reflection: '反射',
  acrobat: '杂技',
  clarity: '清晰',
  'resist mutation': '抗变异',
  'guardian spirit': '守护之灵',
  faith: '信仰',
  archmagi: '大法师',
  rampage: '冲锋',
  roll: '滚动',
}

const RUNE_NAME_ZH: Record<string, string> = {
  decaying: '腐朽',
  serpentine: '蛇形',
  barnacled: '藤壶',
  gossamer: '蛛丝',
  slimy: '黏液',
  silver: '白银',
  golden: '黄金',
  iron: '钢铁',
  obsidian: '黑曜石',
  icy: '寒冰',
  bone: '骸骨',
  abyssal: '深渊',
  demonic: '恶魔',
  glowing: '辉光',
  magical: '魔力',
  fiery: '烈焰',
  dark: '暗黑',
}

const SPEED_STATUS_ZH: Record<string, string> = {
  'no status effects': '无状态效果',
  'very quick': '极快',
  quick: '急促',
  slow: '缓慢',
  'very slow': '极慢',
}

// Short descriptions from duration-data.h and status.cc, distinct from HUD lights.
const SHORT_STATUS_ZH: Record<string, string> = {
  berserking: '狂暴中', 'short of breath': '气喘', brilliant: '睿智',
  'confusing by touch': '混乱之触', 'lit by a corona': '被光晕照亮',
  'death channelling': '死灵通道', vitalised: '活力充盈', 'divinely vigorous': '神佑体力',
  'ice-armoured': '冰甲护体', 'fiery-armoured': '火甲护体', 'on fire': '着火',
  'calling ooze': '唤泥', sleeping: '沉睡', "in death's door": '身处死门',
  'especially stealthy': '格外隐蔽', afraid: '畏惧', 'in a vortex': '身处漩涡',
  'raining reagents': '降下试剂', 'chanting a vengeful prayer': '吟诵复仇祷词',
  enshackling: '施展枷锁', liquefying: '液化地面', heroic: '英雄气概', 'finesse-ful': '技艺精妙',
  disjoining: '空间解离', fugue: '亡者赋格', untranslocatable: '无法移位',
  immotile: '无法移动', 'no stairs': '无法使用楼梯', enlightened: '启悟',
  'radiating poison': '散发剧毒', reciting: '诵经', 'fire vulnerable': '易受火伤',
  'poison vulnerable': '易受毒伤', 'portalling projectiles': '投射物传送', forested: '召唤森林',
  'calling dragons': '召唤巨龙', 'protected from fire': '受到火焰防护',
  'protected from cold': '受到寒冷防护', 'protected from electricity': '受到电击防护',
  'protected from physical damage': '受到物理伤害防护', horrified: '惊恐',
  'divinely shielded': '神圣护盾', 'ephemerally shielded': '短暂护盾', cleaving: '横扫',
  'oblivion-hounded': '被湮灭猎犬追踪', attractive: '吸引敌人', rising: '升腾',
  'animating dead': '复苏亡者', 'unleashing the legion': '释放军团', 'surrounded by blades': '利刃环绕',
  'growing destruction': '毁灭之力增长', 'making a cacophony': '制造嘈杂声', 'shroud timeout': '护幕冷却',
  'full of bloodlust': '嗜血', engorged: '饱胀', 'spewing sludge': '喷吐污泥',
  'constricted (roots)': '被根须缠住', 'constricted (zombie hands)': '被尸手缠住',
  "serpent's lash": '蛇形鞭击', 'flooded lungs': '肺部进水', 'extremely drained': '极度汲取',
  'very heavily drained': '遭极重汲取', 'overwhelmed with horror': '被恐惧压垮',
  'extremely horrified': '极度惊恐', duelling: '决斗中', 'inugami summoned': '已召唤犬灵',
  'unable to read': '无法阅读', 'fire susceptible': '易受火伤', 'fortress blast': '堡垒冲击',
  'teleporting to hostiles': '正在传送至敌人身边', 'slimy shroud': '黏液护幕',
  'missing status': '状态缺失', revving: '蓄势中', revved: '蓄势完成',
  'inhibited regen': '再生受抑', 'hasted and slowed': '同时加速和减速',
}

const COOLDOWN_ZH: Record<string, string> = {
  berserk: '狂暴', "death's door": '死门', vortex: '漩涡', recite: '诵经', 'dragon call': '唤龙',
  'word of chaos': '混沌之言', blink: '闪现', gavotte: '加沃特舞', 'hellfire mortar': '狱火迫击炮',
  siphon: '虹吸', bloodrite: '血仪', swarm: '虫群', stardust: '星尘', mesmerism: '魅惑',
  lithotoxin: '石化毒素', eeljolt: '电鳗电击',
}

function dispWidth(s: string): number {
  let w = 0
  for (const ch of s) w += ch.charCodeAt(0) > 255 ? 2 : 1
  return w
}

function lookupCI(raw: string): string {
  const s = raw.trim()
  if (!s) return raw
  const direct = t(s)
  if (direct !== s) return direct
  const lower = s.toLowerCase()
  const hitLower = t(lower)
  if (hitLower !== lower) return hitLower
  const cap = lower.charAt(0).toUpperCase() + lower.slice(1)
  const hitCap = t(cap)
  if (hitCap !== cap) return hitCap
  return raw
}

/**
 * Translate a DCSS player skill title ("the Cleaver", ", Who Hides the Stars",
 * " La Petite Mort"). Returns the original title unchanged when unknown or in
 * English mode.
 */
export function translatePlayerTitle(rawTitle: string): string {
  if (!isZh() || !rawTitle) return rawTitle
  const trimmed = rawTitle.trim()
  if (!trimmed) return rawTitle
  const stripped = trimmed
    .replace(/^,\s*/, '')
    .replace(/^(?:the|La|of a)\s+/i, '')
    .trim()
  if (!stripped) return rawTitle
  const extra = EXTRA_PLAYER_TITLES_ZH[stripped]
  if (extra) return extra
  const dict = lookupCI(stripped)
  if (dict !== stripped) return dict
  return rawTitle
}

function translateSpeciesBg(role: string): string {
  const s = role.trim()
  if (!s) return role
  // 4-letter abbreviated combo ("MiFi", "DEFE", "GrEE") when title line is wide.
  if (/^[A-Za-z]{4}$/.test(s)) {
    const sp = SPECIES_ABBREV_ZH[s.slice(0, 2)]
    const bg = BG_ABBREV_ZH[s.slice(2, 4)]
    if (sp && bg) return `${sp}${bg}`
  }
  const direct = lookupCI(s)
  if (direct !== s) return direct
  const words = s.split(/\s+/)
  for (let i = 1; i < words.length; i++) {
    const left = words.slice(0, i).join(' ')
    const right = words.slice(i).join(' ')
    const zl = lookupCI(left)
    const zr = lookupCI(right)
    if (zl !== left && zr !== right) return `${zl}${zr}`
  }
  return role
}

function translateGodName(name: string): string {
  const s = name.trim()
  if (!s) return name
  if (GOD_NAME_ZH[s]) return GOD_NAME_ZH[s]
  const zh = lookupCI(s)
  return zh !== s ? zh : name
}

function translateTitleLine(line: string): string {
  const m = /^((?:<[^>]+>)*)(.*?)\s+\(([^()]+)\)(\s+)Turns:\s*(\d+),\s*Time:\s*([\d:]+)((?:<[^>]+>)*)$/.exec(line)
  if (!m) return line
  const [, openTags, rawIdent, roleRaw, gap, turns, time, closeTags] = m
  let ident = rawIdent
  const titleMatch =
    /^(.+?)(,\s*(?:Who [A-Z].*|Xom's Canvas|Unburdened By Reality|Survivor of Endless Pranks))$/.exec(rawIdent)
    ?? /^(.+?)\s+(La Petite Mort|Ex Machina|of a Hundred Blades)$/.exec(rawIdent)
    ?? /^(.+) (the\s+[A-Z].*)$/.exec(rawIdent)
  if (titleMatch) {
    const zhTitle = translatePlayerTitle(titleMatch[2])
    if (zhTitle !== titleMatch[2]) ident = `${titleMatch[1]} ${zhTitle}`
  }
  const zhRole = translateSpeciesBg(roleRaw)
  const left = `${ident}（${zhRole}）`
  const right = `回合: ${turns}，时间: ${time}`
  const origLeftWidth = dispWidth(rawIdent) + 3 + dispWidth(roleRaw)
  const origRightWidth = `Turns: ${turns}, Time: ${time}`.length
  const totalWidth = origLeftWidth + gap.length + origRightWidth
  const pad = Math.max(2, totalWidth - dispWidth(left) - dispWidth(right))
  return `${openTags}${left}${' '.repeat(pad)}${right}${closeTags}`
}

function translateStatsLine(line: string): string {
  let out = line
  // Column 0: Health / HP / Magic / MP / Gold (preserve exact width 8 or 6).
  out = out
    .replace(/\bHealth: /g, '生命:   ')
    .replace(/\bHP:   /g, '生命: ')
    .replace(/\bMagic:  /g, '法力:   ')
    .replace(/\bMP:   /g, '法力: ')
    .replace(/\bGold:   /g, '金币:   ')
    .replace(/\bGold: /g, '金币: ')

  // Column 1: AC / EV / SH (width 4 -> 6, absorb 2 trailing spaces after value).
  out = out.replace(
    /\b(AC|EV|SH): ((?:<[^>]+>)*)([ +-]*\d+)( *)/g,
    (_all, cap: string, tags: string, val: string, sp: string) => {
      const zh = cap === 'AC' ? '防御' : cap === 'EV' ? '闪避' : '格挡'
      const pad = sp.length ? ' '.repeat(Math.max(1, sp.length - 2)) : ''
      return `${zh}: ${tags}${val}${pad}`
    },
  )

  // Column 2: Str / Int / Dex (width 5 -> 6, absorb 1 trailing space after value).
  out = out.replace(
    /\b(Str|Int|Dex): ((?:<[^>]+>)*)([ +-]*\d+)( *)/g,
    (_all, cap: string, tags: string, val: string, sp: string) => {
      const zh = cap === 'Str' ? '力量' : cap === 'Int' ? '智力' : '敏捷'
      const pad = sp.length ? ' '.repeat(Math.max(1, sp.length - 1)) : ''
      return `${zh}: ${tags}${val}${pad}`
    },
  )

  // Column 3: XL / Next / God / Spells / Lives / Deaths.
  out = out
    .replace(/\bXL:     /g, '等级:   ')
    .replace(/\bXL: /g, '等级: ')
    .replace(/\bNext: /g, '下级: ')
    .replace(/\bLives:  /g, '生命数: ')
    .replace(/\bDeaths: /g, '死亡数: ')
    .replace(/\bSpells: ((?:<[^>]+>)*)(\d+\/\d+) levels? left\b/g, '法术:   $1剩余 $2 级')
    .replace(/\bSpells: /g, '法术:   ')
    .replace(
      /\bGod:( +)((?:<[^>]+>)*)([A-Za-z][A-Za-z ']*?)(?=(?:\s+[\[\d]|\s*\(|\s*<|\s*$))/g,
      (_all, sp: string, tags: string, godName: string) => {
        const pad = ' '.repeat(Math.max(1, sp.length - 1))
        return `信仰:${pad}${tags}${translateGodName(godName)}`
      },
    )
    .replace(/\bGod:    /g, '信仰:   ')

  return out
}

function translateSlotName(slot: string): string {
  const s = slot.trim().toLowerCase()
  if (SLOT_NAME_ZH[s]) return SLOT_NAME_ZH[s]
  const numbered = /^(.+?)\s+(\d+)$/.exec(s)
  if (numbered && SLOT_NAME_ZH[numbered[1]]) return `${SLOT_NAME_ZH[numbered[1]]}${numbered[2]}`
  return slot
}

function translateOverviewItem(rawItem: string): string {
  const s = rawItem.trim()
  if (!s) return rawItem
  let melded = false
  let body = s
  if (/^melded\s+/i.test(body)) {
    melded = true
    body = body.replace(/^melded\s+/i, '')
  }
  let zh = tItem(body)
  if (zh === body) {
    // output.cc uses item.name(DESC_PLAIN, true) without leading articles
    // ("pair of gloves"); retry with an article if bare lookup missed.
    const withArt = tItem(`a ${body}`)
    if (withArt !== `a ${body}`) zh = withArt
  }
  if (zh === body) zh = lookupCI(body)
  return melded ? `${zh}（已融合）` : zh
}

function translateEquipPart(equip: string): string {
  if (!equip || !/[A-Za-z]/.test(equip)) return equip
  // Empty / unavailable / occupied slots (preserving <darkgrey> tags).
  let out = equip
    .replace(/\(no ([^()]+)\)/gi, (_m, slot: string) => `(无${translateSlotName(slot)})`)
    .replace(/\(([^()]+) unavailable\)/gi, (_m, slot: string) => `(${translateSlotName(slot)}不可用)`)
    .replace(/\[([^\]]+) occupied\]/gi, (_m, slot: string) => `[${translateSlotName(slot)}槽已占用]`)
  if (out !== equip) return out

  // Equipped item row: "<w>a</w> - <col>ITEM</col>" or plain "a - ITEM".
  const taggedItem = /^((?:<[^>]+>)*[a-zA-Z](?:<\/[^>]+>)*\s+-\s+(?:<[^>]+>)*)([^<]+)((?:<\/[^>]+>)*\s*)$/.exec(equip)
  if (taggedItem) {
    const [, prefix, itemText, suffix] = taggedItem
    return `${prefix}${translateOverviewItem(itemText)}${suffix}`
  }

  // Unarmed row: "  - unarmed" / "  - claws".
  const unarmed = /^(\s*-\s+(?:<[^>]+>)*)([^<]+)((?:<\/[^>]+>)*\s*)$/.exec(equip)
  if (unarmed) {
    const [, prefix, atk, suffix] = unarmed
    const key = atk.trim().toLowerCase()
    const zh = UNARMED_ZH[key] ?? lookupCI(atk.trim())
    return `${prefix}${zh}${suffix}`
  }

  return equip
}

// The left cell can contain spaces (an empty stealth bar) or a separate
// colour run for the resistance percentage. Find the equipment by its grammar.
function translateEquipSuffix(tail: string, overflow = 0): string {
  const tags = '(?:</?[a-z]+>)*'
  const start = new RegExp(`( +)(${tags}(?:[A-Za-z]${tags} +- | - |\\(no |\\([^()]+ unavailable\\)|\\[[^\\]]+ occupied\\]).*)$`, 'i')
  return tail.replace(start, (_all, gap: string, equip: string) =>
    ' '.repeat(Math.max(1, gap.length - overflow)) + translateEquipPart(equip))
}

function translateResistEquipLine(line: string): string {
  // 1. Resistance row: "<col>rFire   . . .      (100%) <equip>"
  const res = /^((?:<[^>]+>)*)(rFire|rCold|rNeg|rPois|rElec|rCorr|SInv|Will|Stlth)( {1,4})(.*)$/.exec(line)
  if (res) {
    const [, openTags, label, sp, tail] = res
    const zh = RESIST_LABEL_ZH[label] ?? label
    const pad = sp.slice(0, 8 - label.length)
    const rest = sp.slice(pad.length) + tail
    const origLabelCols = label.length + pad.length
    const zhWidth = dispWidth(zh)
    const newSpaces = Math.max(1, origLabelCols - zhWidth)
    const overflow = Math.max(0, zhWidth + newSpaces - origLabelCols)

    return `${openTags}${zh}${' '.repeat(newSpaces)}${translateEquipSuffix(rest, overflow)}`
  }

  // 2. Regen row: "HPRegen 0.33/turn       <equip>"
  const regen = /^((?:<[^>]+>)*)(HP|MP)Regen( +)([\d.]+\/turn\*?)(.*)$/.exec(line)
  if (regen) {
    const [, openTags, kind, sp, rate, tail] = regen
    const zhLabel = kind === 'HP' ? '回血' : '回魔'
    const zhRate = rate.replace('/turn', '/回合')
    // Align the rate with resistance pips at column 8.
    const padAfterLabel = ' '.repeat(Math.max(1, 7 + sp.length - dispWidth(zhLabel)))
    return `${openTags}${zhLabel}${padAfterLabel}${zhRate}${translateEquipSuffix(tail)}`
  }

  // 3. Equipment-only continuation row (e.g. Octopode extra rings).
  const equipOnly = /^((?:<[^>]+>)* {15,})(.+)$/.exec(line)
  if (equipOnly) return `${equipOnly[1]}${translateEquipPart(equipOnly[2])}`

  return line
}

function translatePassiveEntry(raw: string): string {
  const s = raw.trim()
  if (!s) return s
  const lower = s.toLowerCase()
  if (PASSIVE_ZH[lower]) return PASSIVE_ZH[lower]
  const harm = /^harm \(\+(\d+)% outgoing, \+(\d+)% incoming\)$/i.exec(s)
  if (harm) return `伤害加深（造成+${harm[1]}%，承受+${harm[2]}%）`
  const inacc = /^inaccuracy \((-\d+)\)$/i.exec(s)
  if (inacc) return `失准（${inacc[1]}）`
  const rage = /^random rage \((\d+)%\)$/i.exec(s)
  if (rage) return `随机狂暴（${rage[1]}%）`
  const corr = /^corrode self \((\d+)%\)$/i.exec(s)
  if (corr) return `自我腐蚀（${corr[1]}%）`
  const slow = /^slow self \((\d+)%\)$/i.exec(s)
  if (slow) return `自我减速（${slow[1]}%）`
  const wiz = /^wizardry \(x(\d+)\)$/i.exec(s)
  if (wiz) return `巫术（x${wiz[1]}）`
  const chan = /^channel magic \((\d+)%\)$/i.exec(s)
  if (chan) return `引导魔力（${chan[1]}%）`
  const inf = /^infuse magic \((\d+) (HP|MP)\)$/i.exec(s)
  if (inf) return `注入魔力（${inf[1]} ${inf[2] === 'HP' ? '生命' : '法力'}）`
  const ramp = /^(rampage|roll)\+(\d+|∞|inf)$/i.exec(s)
  if (ramp) return `${ramp[1].toLowerCase() === 'roll' ? '滚动' : '冲锋'}+${ramp[2] === 'inf' ? '∞' : ramp[2]}`
  return lookupCI(s)
}

function translateStatusEntry(raw: string): string {
  const s = raw.trim()
  if (!s) return s
  const lower = s.toLowerCase()
  if (SPEED_STATUS_ZH[lower]) return SPEED_STATUS_ZH[lower]
  if (SHORT_STATUS_ZH[lower]) return SHORT_STATUS_ZH[lower]
  const expiring = /^(.*) \(expiring\)$/.exec(s)
  if (expiring) return `${translateStatusEntry(expiring[1])}（即将结束）`
  const cooldown = /^on (.+) cooldown$/.exec(lower)
  if (cooldown && COOLDOWN_ZH[cooldown[1]]) return `${COOLDOWN_ZH[cooldown[1]]}冷却中`
  const penalty = /^corroded \(([-+]?\d+)\)$/.exec(lower)
  if (penalty) return `腐蚀（${penalty[1]}）`
  const trickster = /^trickster \((\+\d+) AC\)$/.exec(s)
  if (trickster) return `诡术（护甲 ${trickster[1]}）`
  const fragile = /^fragile \((\+\d+%) incoming damage\)$/.exec(s)
  if (fragile) return `脆弱（承受伤害 ${fragile[1]}）`
  const bribe = /^bribing \[(.+)\]$/.exec(s)
  if (bribe) return `贿赂中［${bribe[1].split(/,\s*/).map(lookupCI).join('、')}］`
  const studying = /^studying (.+)$/.exec(s)
  if (studying) return `研习${studying[1].split(/\s+and\s+/).map(lookupCI).join('、')}`
  const poison = /^(lethally|seriously|quite|mildly) poisoned$/.exec(lower)
  if (poison) {
    const grade: Record<string, string> = { lethally: '致命', seriously: '严重', quite: '较重', mildly: '轻微' }
    return `${grade[poison[1]]}中毒`
  }
  if (lower === 'invisible (but backlit and visible)') return '隐形（但因背光而可见）'
  const light = translateStatusLight(s)
  if (light !== s) return light
  return lookupCI(s)
}

function translateMutationEntry(raw: string): string {
  const s = raw.trim()
  if (!s) return s
  // Preserve optional <darkgrey>...</darkgrey>, outer (...) suppressed-by-form,
  // and [...] temporary-mutation wrappers.
  const tagM = /^((?:<[^>]+>)*)(.*?)((?:<\/[^>]+>)*)$/.exec(s)
  const openTag = tagM?.[1] ?? ''
  let inner = tagM?.[2] ?? s
  const closeTag = tagM?.[3] ?? ''

  let pre = ''
  let post = ''
  if (inner.startsWith('(') && inner.endsWith(')')) {
    pre += '('
    post = ')' + post
    inner = inner.slice(1, -1)
  }
  if (inner.startsWith('[') && inner.endsWith(']')) {
    pre += '['
    post = ']' + post
    inner = inner.slice(1, -1)
  }

  let levelSuffix = ''
  const lv = /^(.+?)\s+(\d+(?:\[\+\d+\])?)$/.exec(inner)
  if (lv) {
    inner = lv[1]
    levelSuffix = ` ${lv[2]}`
  }

  const zh = translateMutationName(inner)
  return `${openTag}${pre}${zh}${levelSuffix}${post}${closeTag}`
}

function translateSectionBody(kind: string, body: string): string {
  const trimmed = body.trim()
  if (!trimmed) return body
  if (kind === '0') {
    return trimmed === 'Orb of Zot' ? '佐特宝珠' : lookupCI(trimmed)
  }
  if (kind === '}') {
    const rm = /^(\d+\/\d+)\s+runes?:\s*(.+)$/i.exec(trimmed)
    if (rm) {
      const runes = rm[2].split(/,\s*/).map((r) => {
        const key = r.trim().toLowerCase()
        return RUNE_NAME_ZH[key] ?? lookupCI(r.trim())
      })
      return `${rm[1]} 枚符文：${runes.join('，')}`
    }
    return trimmed
  }
  // A comma inside a qualifier (e.g. harm) is not a list separator.
  const pieces = trimmed.split(/,\s+(?![^()\[\]]*[)\]])/)
  if (kind === '%') return pieces.map(translatePassiveEntry).join('，')
  if (kind === '@') return pieces.map(translateStatusEntry).join('，')
  if (kind === 'A') return pieces.map(translateMutationEntry).join('，')
  return body
}

/** Detect a `%` character overview body (even when tag "resists" is absent). */
export function isCharOverview(text: string): boolean {
  const plain = text.replace(/<[^>]+>/g, '')
  return /\bTurns:\s*\d+,\s*Time:\s*\d/.test(plain)
    && (/\brFire\s+/.test(plain) || /\bHPRegen\s+/.test(plain))
}

/**
 * Translate a `%` character overview screen while preserving every DCSS colour
 * tag and table column alignment.
 */
export function translateCharOverview(rawBody: string): string {
  if (!isZh() || !rawBody) return rawBody
  const lines = rawBody.split('\n')
  const out: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Bottom status / passive / mutation / orb / rune sections: join wrapped
    // 80-column continuation lines before translating comma-separated items.
    const sec = /^((?:<[^>]+>)*)([%@A0}]):((?:<\/[^>]+>)*)(\s+)(.*)$/.exec(line)
    if (sec) {
      const [, openTag, kind, closeTag, sp, firstRest] = sec
      let joined = firstRest
      while (
        i + 1 < lines.length
        && lines[i + 1].trim() !== ''
        && !/^(?:<[^>]+>)*[%@A0}]:/.test(lines[i + 1])
      ) {
        i++
        joined += ' ' + lines[i].trim()
      }
      out.push(`${openTag}${kind}:${closeTag}${sp}${translateSectionBody(kind, joined)}`)
      i++
      continue
    }

    // Title line ("Name the Cleaver (Minotaur Fighter)   Turns: N, Time: ...").
    if (/\bTurns:\s*\d+,\s*Time:\s*\d/.test(line)) {
      out.push(translateTitleLine(line))
      i++
      continue
    }

    // Stats block rows ("Health: ... AC: ... Str: ... XL: ...").
    if (/^(?:<[^>]+>| )*(?:Health|HP|Magic|MP|Gold|AC|EV|SH|Str|Int|Dex|XL|God|Spells|Lives|Deaths):/.test(line)) {
      out.push(translateStatsLine(line))
      i++
      continue
    }

    // Resistance / regen + equipment rows.
    out.push(translateResistEquipLine(line))
    i++
  }

  return out.join('\n')
}
