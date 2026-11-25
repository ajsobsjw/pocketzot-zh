import { stripDcss } from '../game/dcss-colors'
import { isZh, t } from './index'
import data from './data/zh-mutations.json'
import { MUTATION_PROSE_ZH } from './mutation-prose-zh'

const descriptions: Record<string, string[]> = data.descriptions
const names: Record<string, string> = data.names
const shortRows: Record<string, string> = data.shortRows
const own = (table: object, key: string) => Object.prototype.hasOwnProperty.call(table, key)
const nameOverrides: Record<string, string> = {
  horns: '角顶', claws: '利爪', hooves: '蹄', tentacles: '触手', spellclaws: '法爪',
  'retaliatory headbutt': '报复性头槌', 'golden breath': '黄金吐息', 'no striking features': '无明显特征',
  'spit poison': '吐毒', 'hurl damnation': '投掷业火', 'removed mutation': '已移除的变异',
  'no rings': '无法佩戴戒指', 'vampire fangs': '吸血鬼尖牙', bloodcurse: '血咒',
  insubstantial: '虚体', 'frigid aura': '严寒光环', 'hive swarm': '蜂群护卫',
  'water reaching': '水体延伸', 'water splatter': '溅水', 'freeze response': '遇寒结冰',
  'steam response': '遇火汽化', 'airstrike attack': '旋风打击', 'hex mastery': '妖术精通',
  'riddle compulsion': '猜谜冲动', werefury: '兽化狂怒', werehowl: '兽化嚎叫',
  'stinger hair': '螫刺触须', lithotoxin: '石化毒素', contaminating: '变形污染',
  'maw attack': '巨口撕咬', 'devouring maw': '吞噬巨口', 'growling stomach': '饥肠咕噜',
  'eel punch': '电鳗拳击', eeljolt: '电鳗放电', 'blade parry': '利刃格挡',
  'armoured shell': '装甲外壳', 'hypnotic gaze': '催眠凝视',
}

export function translateMutationName(source: string): string {
  if (!isZh()) return source
  const key = source.toLowerCase()
  const override = own(nameOverrides, key) ? nameOverrides[key] : undefined
  if (override) return override
  const canonical = own(names, key) ? names[key] : source
  for (const form of [canonical, canonical.toLowerCase(), canonical[0]?.toUpperCase() + canonical.slice(1)]) {
    const zh = t(form)
    if (zh !== form) return zh
  }
  return source
}

const categories: Record<string, string> = {
  Anatomy: '解剖结构', Substance: '物质', Blood: '血液', Bones: '骨骼', Hands: '双手',
}
const energy: Record<string, string> = {
  'acid or metal splinters': '酸液或金属碎片', 'negative energy or devastation': '负能量或毁灭之力',
  'fire or lava': '火焰或岩浆', 'cold or ice': '寒气或冰霜',
}
const dynamic: Record<string, string> = {
  'protean grace': '([+-]\\d+) EV and Slay ([+-]\\d+) from this mutation\\.',
  trickster: '(\\d+(?:\\.\\d+)?)', mnemnophage: '(\\d+)',
  'mark of carnage': `(${Object.keys(energy).join('|')})`,
  'mark of annihilation': `(${Object.keys(energy).join('|')})`,
}
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function translateProse(key: string, source: string): string | null {
  const entry = own(descriptions, key) ? descriptions[key] : undefined
  if (!entry) return null
  const [en, upstream] = entry
  const zh = MUTATION_PROSE_ZH[key] ?? upstream
  const pattern = en.split(/(%value%|%key%)/).map(part =>
    part === '%value%' ? dynamic[key] : part === '%key%' ? '([^.!?]{1,40})' : escape(part)).join('')
  // Keep the actual shortcut and its markup rather than translating the key
  // or reconstructing its colour from the dictionary.
  const match = new RegExp(`^${pattern}$`).exec(source.replace(/\s+/g, ' ').trim())
  if (!match || !zh) return null
  return zh.replace(/%([12])|<input>\$cmd\[[^\]]+\]<\/input>/g, (_whole, index?: string) => {
    const value = match[index ? Number(index) : 1] ?? ''
    return own(energy, value) ? energy[value] : value
  })
}

/** Generic overlays share their protocol type with other descriptions. Only
 * claim one with a mutation category, a level suffix, or matching source prose. */
export function localizeMutationDetail(title: string, body: string): { title: string; body: string } | null {
  if (!isZh()) return null
  const level = / \(level (\d+)\/(\d+)\)$/i.exec(title)
  const name = level ? title.slice(0, level.index) : title
  const key = name.toLowerCase()
  if (!own(names, key)) return null
  const extraIdx = body.search(/(?:^|\n)[ \t]*(?:Category: \[|Trigger chance:|Base damage:|_{5,})/)
  const prose = extraIdx < 0 ? body : body.slice(0, extraIdx)
  const extras = extraIdx < 0 ? '' : body.slice(extraIdx)
  const translated = translateProse(key, prose)
  const short = translateMutationRow(prose)
  if (!translated && !level && !/\bCategory: \[/.test(extras) && short === prose) return null
  const zhName = translateMutationName(name)
  return {
    title: zhName + (level ? `（等级 ${level[1]}/${level[2]}）` : ''),
    body: (translated ?? short) + extras
      .replace(/^[ \t]*Category: \[([^\n]+)\]/gm, (_all, tags: string) =>
        `类别：［${tags.replace(/\b(Anatomy|Substance|Blood|Bones|Hands)\b/g, key => categories[key]).replace(/, /g, '、')}］`)
      .replace(/\bTrigger chance: +/g, '触发几率：')
      .replace(/\bBase damage: +/g, '基础伤害：'),
  }
}

export function isMutationMenu(title: string): boolean {
  return stripDcss(title).trim() === 'Innate Abilities, Weirdness & Mutations'
}

function translateShort(text: string): string {
  if (own(shortRows, text)) return shortRows[text]
  if (own(extraRows, text)) return extraRows[text]
  for (const [prefix, zh] of statPrefixes) {
    if (!text.startsWith(prefix)) continue
    const stat = /^(\d+)(?: EV, Slay ([+-]\d+))?\)$/.exec(text.slice(prefix.length))
    if (stat) return `${zh}${stat[1]}${stat[2] ? ` 闪避，杀戮 ${stat[2]}` : ''}）`
  }
  const tentacles = /^You have tentacles for arms and can constrict up to ([a-z-]+) enemies at once\.$/.exec(text)
  if (tentacles && own(counts, tentacles[1])) return `你的手臂是触手，最多能同时缠住 ${counts[tentacles[1]]} 个敌人。`
  const rings = /^You can wear up to ([a-z-]+) rings at the same time\.$/.exec(text)
  if (rings && own(counts, rings[1])) return `你最多能同时佩戴 ${counts[rings[1]]} 枚戒指。`
  const skin = /^Your (serpentine skin is tough|(.+) scales are hard)\. \(AC \+(\d+)\)$/.exec(text)
  if (skin) return `${skin[2] ? '你的鳞片坚硬' : '你的蛇皮坚韧'}。（防御 +${skin[3]}）`
  return t(text)
}

const statPrefixes = Object.entries(shortRows).filter(([row]) => row.endsWith('+'))
const counts: Record<string, number> = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 }
const extraRows: Record<string, string> = {
  'Removed mutation': '已移除的变异', 'You are rather mundane.': '你没有明显的特征。',
  'You expend health (3 HP) to strengthen your wands.': '你消耗生命（3 点）来强化魔杖。',
  'Your magical power will grow resistant to disruption.': '你的魔力将变得不易受干扰。',
  'Your tail will grow strong enough to constrict your foes.': '你的尾巴将变得足够强壮，能够缠住敌人。',
  'You will be able to unleash your equipped armour.': '你将能让装备的护甲自行出击。',
  'You will be able to burn memories to enhance your damage-dealing spells.': '你将能燃烧记忆，强化伤害法术。',
  'You can walk on water until reaching land.': '你能在水面行走，直到踏上陆地。',
  'You can breathe a blast of fire, cold, and poison.': '你能喷吐烈火、寒气和毒素。',
  'Your life essence is reduced to manifest your ancestor. (-10% HP)': '你献出部分生命精华以唤出祖灵。（生命上限 -10%）',
  'Your facial features look somewhat orcish.': '你的面容有些像兽人。',
  'Your facial features are unmistakably orcish.': '你的面容显然已是兽人的模样。',
  'Your breath weapon is enhanced in this form.': '这种形态会强化你的吐息。',
  'Your maximum health is increased.': '你的生命上限提高了。',
  'Your maximum health is greatly increased.': '你的生命上限大幅提高。',
  'Your maximum health is decreased.': '你的生命上限降低了。',
  'Your maximum health is decreased, since you lack skill for your form.': '你的变形术技能不足，生命上限降低了。',
  'Your body armour is much less effective at protecting you.': '你的身甲防护效果大幅降低。',
  'Your body armour is less effective at protecting you.': '你的身甲防护效果降低了。',
  'Your body armour is slightly less effective at protecting you.': '你的身甲防护效果略有降低。',
  'Your equipment is entirely melded.': '你的所有装备都已融入身体。',
  'Your weapons and armour are melded.': '你的武器和护甲都已融入身体。',
  'Your auxiliary armour is melded.': '你的附属护甲已融入身体。',
  'Your equipment is almost entirely melded': '你的装备几乎全部融入身体。',
  'You cover ground slowly.': '你的移动速度较慢。',
  'You often become slowed when damaged by fire.': '受到火焰伤害时，你常会减速。',
  'You often become weak and blind when damaged by cold.': '受到寒冷伤害时，你常会虚弱并失明。',
  'You often become unable to move when damaged by electricity.': '受到电击伤害时，你常会无法移动。',
  'Your slaying and spellpower are decreased in confined spaces.': '在狭窄空间里，你的杀戮加成和法术威力会降低。',
  'Your evasion is greatly reduced on turns you move or wait in place.': '移动或原地等待的回合，你的闪避大幅降低。',
  'You heal other nearby enemies whenever you kill a monster.': '每当你杀死一个怪物，都会治疗附近的其他敌人。',
  'Enemies in your sight sometimes split into clones of themselves.': '视野中的敌人有时会分裂出自己的分身。',
  'Enemies you spot sometimes become touched by paradox.': '你看到的敌人有时会受到悖论影响。',
  'Enemies you encounter may be immune to damage from range.': '你遇到的敌人可能免疫远距离伤害。',
  'When enemies are summoned, they will appear beside you instead.': '被召唤的敌人会改为出现在你身边。',
  'When alone and injured, reapers sometimes come to claim you.': '当你独自一人且负伤时，收割者有时会前来索命。',
}

const futureRows = new Map(Object.keys(shortRows).map(row => [row
  .replace(/ can /g, ' will be able to ').replace(/ have /g, ' will have ')
  .replace(/ are /g, ' will be ').replace(/ is /g, ' will be '), row]))

export function translateMutationRow(source: string): string {
  if (!isZh()) return source
  const plain = stripDcss(source)
  const m = /^(\s*(?:\S [-+ ] )?)(.*?)(\s+XL \d+| \[\d+\.\d+\])?(\s*)$/s.exec(plain)
  if (!m) return source
  let core = m[2]
  while ((core.startsWith('[') && core.endsWith(']')) || (core.startsWith('(') && core.endsWith(')'))) {
    core = core.slice(1, -1)
  }
  const future = m[3] ? futureRows.get(core) : undefined
  const zh = translateShort(core)
  const translated = zh === core && future ? `届时：${shortRows[future]}` : zh
  let out = source
  if (translated !== core) out = out.replace(core, () => translated)
  if (m[3]?.includes('XL ')) out = out.replace(/\bXL (\d+)/, '等级 $1')
  return out
}

export function translateMutationMenuFooter(source: string): string {
  if (!isZh()) return source
  return source.replace(/: Suppressed\./g, '：已压制。')
    .replace(/: Transient mutations\./g, '：临时变异。')
    .replace(/: Gained at a future XL\./g, '：将在之后的经验等级获得。')
}
