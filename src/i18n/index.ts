// Display-only localization layer.
//
// Contract (do not break it):
//   * Nothing the game parses may pass through here. Views keep raw English in
//     their models; only what is about to be written to the DOM is translated.
//   * A lookup that is not confident returns the input unchanged — half a
//     translated sentence is worse than an English one. Templates whose
//     captures stay English are rejected as a whole, and compound lines are
//     translated only when every sentence matches.
//   * Switching back to English restores the original text (dom.ts keeps the
//     originals for it, message-log.ts keeps each row's wire text and re-renders).

import { compileDict, fill, lookup, type Matcher } from './translate'
import { translateItem } from './items'
import { matchTitle } from './titles'
import { UI_ZH } from './ui-zh'
import { SUPP_ZH } from './supp-zh'
import { ABILITY_NAMES, ITEM_NAMES, MONSTER_NAMES, featureName } from './names-zh'
import { MANUAL_NAMES } from './manual-zh'
import { noteMiss } from './miss-log'
import { getPref, setPref } from '../prefs'

export type Lang = 'zh' | 'en'

export const LANG_CHANGED_EVENT = 'pocketzot:lang-changed'

export const IS_TEST =
  typeof import.meta !== 'undefined' &&
  (import.meta as unknown as { env?: { MODE?: string } }).env?.MODE === 'test'

let lang: Lang = (() => {
  if (IS_TEST) return 'en'
  // Escape hatch for debugging: ?no-i18n=1 renders the app exactly as English.
  try {
    if (new URLSearchParams(window.location.search).has('no-i18n')) return 'en'
  } catch { /* no window */ }
  return getPref('language')
})()
let matcher: Matcher | null = null
let loading: Promise<void> | null = null
const cache = new Map<string, string | null>()
const CACHE_MAX = 4000

export function getLang(): Lang {
  return lang
}

export function isZh(): boolean {
  return lang === 'zh'
}

/** Load the dictionary (only when Chinese is on). Safe to call repeatedly. */
export function loadDict(): Promise<void> {
  if (matcher) return Promise.resolve()
  if (!loading) {
    loading = import('./data/zh.json').then((mod) => {
      const raw = (mod.default ?? mod) as { entries: Record<string, string> }
      // Supplements fill the gaps the engine dictionary leaves (menu category
      // words, prompt questions, common item nouns). The engine's own
      // translation always wins.
      const merged = new Map(Object.entries(SUPP_ZH))
      // Curated names the engine dictionary lacks (monster types, item bases,
      // abilities); the engine entry still wins where both exist.
      for (const table of [MONSTER_NAMES, ITEM_NAMES, ABILITY_NAMES, MANUAL_NAMES]) {
        for (const [k, v] of Object.entries(table)) if (!merged.has(k)) merged.set(k, v)
      }
      const COUNT = /%[-+ 0#]*\d*(?:\.\d+)?[sdxc]/g
      for (const [k, v] of Object.entries(raw.entries)) {
        // Engine templates with three or more slots are built for the engine's
        // own argument order (actor, verb, target). Filling them from a client
        // that only sees the final sentence produces "The牦牛了gores you" —
        // unusable. Only our hand-written supplements may use three slots.
        const slots = (k.match(COUNT) ?? []).length
        if (slots > 2) continue
        merged.set(k, v)
      }
      matcher = compileDict(merged)
    })
  }
  return loading
}

export async function initI18n(): Promise<void> {
  if (lang === 'zh') await loadDict()
}

export async function setLang(next: Lang): Promise<void> {
  if (next === lang) return
  lang = next
  setPref('language', next)
  if (next === 'zh') {
    await loadDict()
    // The describe dictionary is lazy-loaded in main.ts; a switch from English
    // must load it too, or prose stays English until reload.
    const { loadDescript } = await import('./describe')
    await loadDescript()
  }
  if (typeof document !== 'undefined') document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en'
  // Cached lookups may predate the describe table; drop them after loading.
  cache.clear()
  window.dispatchEvent(new Event(LANG_CHANGED_EVENT))
}

/** Translate a captured %s: names inside sentences ("You see a +0 sling."). */
const PRONOUNS: Record<string, string> = {
  you: '你', your: '你的', yours: '你的', yourself: '你自己',
  me: '我', my: '我的', 'the player': '玩家',
}

const STATUS_WORDS: Record<string, string> = {
  'asleep': '沉睡', 'heavily wounded': '重伤', 'lightly wounded': '轻伤',
  'moderately wounded': '中伤', 'severely wounded': '严重受伤', 'almost dead': '濒死',
  'constricting you': '正在缠绕你', 'slow': '迟缓', 'very slow': '极慢',
  'fast': '很快', 'strong': '强壮', 'wandering': '游荡中',
  "hasn't noticed you": '尚未发现你',
  'quivering stones': '备有石头', 'fleeing': '逃跑中', 'confused': '混乱',
  'invulnerable': '无敌', 'invisible': '隐形', 'berserk': '狂暴',
  'ally target': '盟友目标', 'summoned': '召唤物', 'friendly': '友好',
}

function translateStatusWord(word: string): string {
  const w = word.trim()
  const direct = STATUS_WORDS[w.toLowerCase()]
  if (direct) return direct
  const hit = /^(\d+)% to hit$/.exec(w)
  if (hit) return `命中率 ${hit[1]}%`
  const affect = /^chance to affect:\s*(\d+)%$/i.exec(w)
  if (affect) return `影响几率 ${affect[1]}%`
  return w
}

function translateCapture(raw: string): string {
  if (!matcher) return raw
  const trimmed = raw.trim()
  if (!trimmed || !/[A-Za-z]/.test(trimmed)) return raw
  const pronoun = PRONOUNS[trimmed.toLowerCase()]
  if (pronoun) return pronoun
  // "a kobold, wielding a whip and quivering stones": quivered ammo, not a
  // sling. Translate whatever ammo noun follows "quivering".
  const andQuivering = /^(.*?)\s+and\s+quivering\s+(.+)$/i.exec(trimmed)
  if (andQuivering) {
    return `${translateCapture(andQuivering[1])}，并备有${translateCapture(andQuivering[2])}`
  }
  // "your ice beast" → 你的冰兽
  const poss = /^your\s+(.+)$/i.exec(trimmed)
  if (poss) {
    const inner = translateCapture(poss[1])
    if (inner !== poss[1]) return `你的${inner}`
  }
  // "a gnoll, wielding a +0 spear": translate the parts around the comma.
  if (trimmed.includes(', ')) {
    const pieces = trimmed.split(/,\s+/)
    return pieces.map((p) => translateCapture(p)).join('，')
  }
  const status = trimmed.toLowerCase()
  if (STATUS_WORDS[status]) return STATUS_WORDS[status]
  // "wielding a +0 dagger" with no actor in front (aim rows).
  const leadVerb = /^(wielding|wearing|carrying|quivering)\s+(.+)$/i.exec(trimmed)
  if (leadVerb) {
    const map: Record<string, string> = {
      wielding: '手持', wearing: '身穿', carrying: '携带', quivering: '备有',
    }
    return `${map[leadVerb[1].toLowerCase()]}${translateCapture(leadVerb[2])}`
  }
  // "wielding a +0 dagger"
  const verb = /^(.*?)\s+(wielding|wearing|carrying|quivering)\s+(.+)$/i.exec(trimmed)
  if (verb) {
    const who = translateCapture(verb[1])
    const what = translateCapture(verb[3])
    const map: Record<string, string> = {
      wielding: '手持', wearing: '身穿', carrying: '携带', quivering: '备有',
    }
    return `${who}${map[verb[2].toLowerCase()]}${what}`
  }
  // "a goblin, X and Y" where Y starts with another verb.
  const andVerb = /^(.*?)\s+and\s+((?:wielding|wearing|carrying|quivering)\b.*)$/i.exec(trimmed)
  if (andVerb) {
    return `${translateCapture(andVerb[1])}，${translateCapture(andVerb[2])}`
  }
  // "armour, conjurations and earth magic" — a list of known skill nouns.
  if (/,\s*|\s+and\s+/.test(trimmed)) {
    const pieces = trimmed.split(/,\s*|\s+and\s+/).filter(Boolean)
    const zh = pieces.map((p) => translateCapture(p))
    if (zh.length > 1 && zh.every((z, i) => z !== pieces[i])) {
      return `${zh.slice(0, -1).join('、')}与${zh[zh.length - 1]}`
    }
  }
  const noArticle = trimmed.replace(/^(?:a|an|the|some)\s+/i, '')
  // Dungeon features ("a stone staircase leading down") have their own grammar.
  const feat = featureName(trimmed)
  if (feat && feat !== trimmed) return feat
  const cap = noArticle.charAt(0).toUpperCase() + noArticle.slice(1)
  const title = noArticle.replace(/\b[a-z]/g, (c) => c.toUpperCase())
  const lower = noArticle.toLowerCase()
  const noun = lookup(matcher, noArticle, {}) ?? lookup(matcher, cap, {})
    ?? lookup(matcher, title, {}) ?? lookup(matcher, lower, {})
  if (noun && noun.out !== noArticle) return noun.out
  const item = translateItem(matcher, noArticle) ?? translateItem(matcher, cap)
    ?? translateItem(matcher, lower)
  if (item && item !== noArticle) return item
  return raw
}

const VERB_ZH: Record<string, string> = {
  bites: '咬了', bite: '咬了', claws: '抓伤了', claw: '抓伤了',
  stings: '蜇了', sting: '蜇了', gores: '用角顶了', gore: '用角顶了',
  kicks: '踢了', kick: '踢了', headbutts: '用头撞了', headbutt: '用头撞了',
  tramples: '踩踏了', trample: '踩踏了', 'trunk-slaps': '用鼻子抽打了',
  drains: '吸取了', drain: '吸取了', constricts: '缠绕着', constrict: '缠绕着',
  grabs: '抓住了', grab: '抓住了', hits: '击中了', hit: '击中了',
  misses: '没有击中', miss: '没有击中', pecks: '啄了', peck: '啄了',
  engulfs: '吞没了', engulf: '吞没了',
}

/** Generic "actor verb target" sentence, the shape most combat lines share. */
function translateCombat(plain: string): string | null {
  // "You bite the cane toad but do no damage." — the player's own action has no
  // actor noun, so it needs its own shape.
  const youM = /^You\s+(?:(barely|closely|completely)\s+)?(bites?|claws?|stings?|gores?|kicks?|headbutts?|tramples?|drains?|constricts?|grabs?|hits?|misses?|pecks?|engulfs?)\s+(.+?)(\s+but (?:does|do) no damage)?([.!]+)$/.exec(plain)
  if (youM) {
    const target = translateCapture(youM[3])
    if (target === youM[3]) return null
    const verb = youM[2]
    let body: string
    if (verb.startsWith('miss')) {
      body = youM[1] === 'barely' ? `你勉强没有击中${target}`
        : youM[1] === 'closely' ? `你险些击中${target}`
          : youM[1] === 'completely' ? `你完全没有击中${target}`
            : `你没有击中${target}`
    } else {
      body = `你${VERB_ZH[verb] ?? verb}${target}`
    }
    if (youM[4]) body += '，但没有造成伤害'
    return body + (youM[5].includes('!') ? '！' : '。')
  }
  const m = /^(The|A|An|Your|You)\s+(.+?)\s+(?:(barely|closely|completely)\s+)?(bites?|claws?|stings?|gores?|kicks?|headbutts?|tramples?|trunk-slaps|drains?|constricts?|grabs?|hits?|misses?|pecks?|engulfs?)\s+(.+?)(\s+but (?:does|do) no damage)?([.!]+)$/.exec(plain)
  if (m) {
    const actor = m[1] === 'You' ? '你' : translateCapture(`${m[1]} ${m[2]}`)
    if (actor === `${m[1]} ${m[2]}`) return null
    const target = translateCapture(m[5])
    // An instrument clause ("hits X with Y") belongs to the dictionary templates;
    // a failed target translation means this is not the simple shape.
    if (target === m[5]) return null
    return combatBody(actor, target, m[4], m[3], !!m[6], m[7])
  }
  // Rows without an article: "frilled lizard barely misses you."
  const bare = /^([a-z][A-Za-z' -]{1,30}?)\s+(?:(barely|closely|completely)\s+)?(bites?|claws?|stings?|gores?|kicks?|headbutts?|tramples?|trunk-slaps|drains?|constricts?|grabs?|hits?|misses?|pecks?|engulfs?)\s+(.+?)(\s+but (?:does|do) no damage)?([.!]+)$/.exec(plain)
  if (!bare) return null
  const actor = translateCapture(bare[1])
  if (actor === bare[1]) return null
  const target = translateCapture(bare[4])
  if (target === bare[4]) return null
  return combatBody(actor, target, bare[3], bare[2], !!bare[5], bare[6])
}

function combatBody(actor: string, target: string, verb: string, adverb: string | undefined,
  noDamage: boolean, punct: string): string {
  let body: string
  if (verb.startsWith('miss')) {
    body = adverb === 'barely' ? `${actor}勉强没有击中${target}`
      : adverb === 'closely' ? `${actor}险些击中${target}`
        : adverb === 'completely' ? `${actor}完全没有击中${target}`
          : `${actor}没有击中${target}`
  } else {
    body = `${actor}${VERB_ZH[verb] ?? verb}${target}`
  }
  if (noDamage) body += '，但没有造成伤害'
  return body + (punct.includes('!') ? '！' : '。')
}

/** "Aim: a goblin, wielding a +0 dagger (moderately wounded, 100% to hit)". */function translateAimLine(plain: string): string | null {
  const m = /^Aim:\s*(.+)$/.exec(plain)
  if (!m) return null
  let core = m[1].trim()
  let status: string[] = []
  const paren = /^(.*?)\s*\(([^()]*)\)\s*$/.exec(core)
  if (paren) {
    core = paren[1]
    status = paren[2].split(',').map((s) => s.trim()).filter(Boolean)
  }
  const parts = core.split(/,\s*/)
  const head = translateCapture(parts[0])
  const extras = parts.slice(1).map((p) => translateCapture(p))
  let out = `瞄准：${head}${extras.length ? '，' + extras.join('，') : ''}`
  const st = status.map(translateStatusWord)
  if (st.length) out += `（${st.join('，')}）`
  return out
}

/** "Dungeon:1" → "地牢:1"; numbers and already-Chinese values pass through. */
function translatePlaceValue(tail: string): string {
  if (!matcher) return tail
  const m = /^([A-Za-z][A-Za-z' -]*?)((?::\d+)+)?$/.exec(tail.trim())
  if (!m) return tail
  const name = m[1].trim()
  const depth = m[2] ?? ''
  const hit = matcher.exact.get(name) ?? matcher.exact.get(name.replace(/^(?:the|a|an) /i, ''))
  return hit ? hit + depth : tail
}

/** Long English prose that maps 1:1 to a database entry (species blurbs). */
let proseLookup: ((text: string) => string | null) | null = null

export function setProseLookup(fn: (text: string) => string | null): void {
  proseLookup = fn
}

function splitSentences(text: string): string[] {
  // Hard-wrapped log lines arrive with embedded newlines; treat them as spaces
  // so a sentence split across two lines is still translated as one unit.
  const flat = text.replace(/\n/g, ' ')
  const out: string[] = []
  const re = /([.!?])\s+(?=[<A-Z0-9"“'])/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(flat))) {
    // Keep the whitespace that follows the punctuation so joining untouched
    // English sentences cannot glue them together ("A.B").
    out.push(flat.slice(last, m.index + m[0].length))
    last = m.index + m[0].length
  }
  out.push(flat.slice(last))
  return out.filter((p) => p.length > 0)
}

/** One attempt, no cache: used for a whole line and for each of its sentences. */
function translateOne(text: string): string | null {
  if (proseLookup) {
    // Log lines carry colour tags; the pairs are plain text.
    const plainForProse = text.replace(/<[^>]*>/g, '').trim()
    if (plainForProse.length > 8) {
      const prose = proseLookup(plainForProse)
      if (prose) return prose
    }
  }
  const plainText = text.replace(/<[^>]*>/g, '').trim()
  // Aim rows are a structured line with equipment and status data; the generic
  // dictionary would match "Aim: %s" and leave the rest half-translated.
  if (plainText.startsWith('Aim: ')) {
    const aim = translateAimLine(plainText)
    if (aim) return aim
  }
  // Rules whose subject is a monster/item name: the name needs the capture
  // translator, so they live here rather than in the static table.
  const NAMED_RULES: Array<[RegExp, (n: string) => string]> = [
    [/^(.+?) is destroyed!$/, (n) => `${translateCapture(n)}被摧毁了！`],
    [/^The (.+?) gazes fiercely through you!$/, (n) => `${translateCapture(n)}凶狠地凝视着你！`],
    [/^The (.+?) is no longer moving slowly\.$/, (n) => `${translateCapture(n)}不再缓慢移动。`],
    [/^You unwield your (.+)\.$/, (n) => `你收起了${translateCapture(n)}。`],
    [/^It is currently targeted by (.+)\.$/, (n) => `它正被${translateCapture(n)}锁定。`],
  ]
  // Spell names in prompts are proper nouns from the dictionary: translate them
  // when known, keep the English name otherwise (never guess).
  const castLine = /^(Casting|Aiming):\s*(.+?)\s*\((.+?);\s*(\d+)% risk of failure\)$/.exec(plainText)
  if (castLine) {
    const q: Record<string, string> = {
      safe: '安全', 'mildly dangerous': '稍有危险', dangerous: '危险',
      'quite dangerous': '相当危险', 'extremely dangerous': '极度危险',
    }
    const verb = castLine[1] === 'Casting' ? '施法' : '瞄准'
    return `${verb}：${translateCapture(castLine[2])}（${q[castLine[3].toLowerCase()] ?? castLine[3]}；失败率 ${castLine[4]}%）`
  }
  const memorise = /^Memorise (.+?), consuming (\d+) spell levels? and leaving (\d+)\?$/.exec(plainText)
  if (memorise) {
    return `记忆${translateCapture(memorise[1])}，消耗 ${memorise[2]} 个法术等级，剩余 ${memorise[3]}？`
  }
  const addSpells = /^You add the spells (.+?) to your library\.$/.exec(plainText)
  if (addSpells) return `你把法术${translateCapture(addSpells[1])}加入了法术库。`
  // "Fragment what (e.g. wall or brittle monster)?: an ice beast (almost dead, …)"
  const fragment = /^Fragment what \(e\.g\. wall or brittle monster\)\?:\s*(.+)$/.exec(plainText)
  if (fragment) {
    const core = fragment[1].trim()
    const paren = /^(.*?)\s*\(([^()]*)\)\s*$/.exec(core)
    if (paren) {
      const st = paren[2].split(',').map((s) => translateStatusWord(s.trim())).filter(Boolean)
      return `要碎裂什么（例如墙或脆弱怪物）？：${translateCapture(paren[1])}（${st.join('，')}）`
    }
    return `要碎裂什么（例如墙或脆弱怪物）？：${translateCapture(core)}`
  }
  // "Hit: +0 hand axe  11" — two captures, so it has its own branch.
  const hitRow = /^Hit: (.+?)\s{2,}(.+)$/.exec(plainText)
  if (hitRow) return `命中：${translateCapture(hitRow[1])}  ${hitRow[2]}`
  // Spell-panel lines whose skill name needs the capture translator.
  const spellTrain = /^With your current stats and equipment, training (.+?) to ([\d.]+) would reduce your failure rate to (\d+)%\. This would take about ([\d.]+) XLs?\.?$/.exec(plainText)
  if (spellTrain) {
    return `以你当前的属性和装备，把${translateCapture(spellTrain[1])}训练到 ${spellTrain[2]} 可将失败率降到 ${spellTrain[3]}%。这大约需要 ${spellTrain[4]} 个等级。`
  }
  const found = /^You found it on level (.+) of the (.+)\.$/.exec(plainText)
  if (found) return `你在${translateCapture(found[2])}第 ${found[1]} 层找到了它。`
  const pray = /^You pray to (.+)\.$/.exec(plainText)
  if (pray) return `你向${translateCapture(pray[1])}祈祷。`
  const itemPower = /^At your current (.+) skills, it has a (\d+)% chance to deal up to (\d+) additional (.+) damage\.$/.exec(plainText)
  if (itemPower) {
    const dmg: Record<string, string> = {
      cold: '寒冷', fire: '火焰', poison: '毒素', acid: '酸', negative: '负能量',
      electricity: '电击', corrosion: '腐蚀',
    }
    return `以你当前的${translateCapture(itemPower[1])}技能，它有 ${itemPower[2]}% 几率造成最多 ${itemPower[3]} 点额外${dmg[itemPower[4].toLowerCase()] ?? itemPower[4]}伤害。`
  }
  const sustain = /^You can sustain at most (.+?) creatures? summoned by this spell\.$/.exec(plainText)
  if (sustain) {
    const NUMWORD: Record<string, string> = {
      one: '1', two: '2', three: '3', four: '4', five: '5',
      six: '6', seven: '7', eight: '8', nine: '9', ten: '10',
    }
    const n = NUMWORD[sustain[1].toLowerCase()] ?? sustain[1]
    return `你最多只能维持 ${n} 个由此法术召唤的生物。`
  }
  for (const [re, make] of NAMED_RULES) {
    const m = re.exec(plainText)
    if (m) return make(m[1])
  }
  // Generic "The yak gores your ice beast but does no damage." shape.
  const combat = translateCombat(plainText)
  if (combat) return combat
  // "Welcome, <name> the <race> <class>." / "Welcome back, …": the player name
  // is data and stays verbatim; race and class are translated word by word.
  const welcome = /^Welcome( back)?, (\S+?)(?: the ([^.]+))?\.(?:\s+(.*))?$/.exec(plainText)
  if (welcome) {
    const name = welcome[2]
    const raceClass = welcome[3]
    let label = ''
    if (raceClass) {
      const words = raceClass.split(/\s+/)
      const zh = words.map((w) => translateCapture(w))
      if (zh.every((z, i) => z !== words[i])) label = `（${zh.join('')}）`
    }
    let tail = ''
    const rest = welcome[4] ?? ''
    const known = /^Please select your (species|background)\.$/.exec(rest)
    if (known) tail = known[1] === 'species' ? '请选择你的种族。' : '请选择你的职业。'
    else if (rest) {
      const zh = t(rest)
      if (zh !== rest) tail = zh
    }
    return `${welcome[1] ? '欢迎回来' : '欢迎'}，${name}${label}。${tail}`
  }
  // A handful of narrow, high-value rules (weapon panel, monster stats, spell
  // prompts) win over the dictionary: they read the numbers and keep the order.
  const ruled = matchTitle(plainText)
  if (ruled) return ruled
  // "A stone wall" / "A stone staircase leading down" — dungeon features.
  const feat = featureName(plainText)
  if (feat) return feat
  // "2 goblins" / "3 ball pythons" — monster count rows.
  const count = /^(\d+)\s+([A-Za-z][A-Za-z' -]+)$/.exec(plainText)
  if (count) {
    const noun = translateCapture(count[2].replace(/s$/, ''))
    if (noun !== count[2].replace(/s$/, '')) return `${count[1]} 个${noun}`
  }
  let r = lookup(matcher!, text, { allowLabels: true })
  if (r && r.args && r.tmpl) {
    // A capture that swallowed whole clauses means a generic template matched
    // ("You feel %s." against "You feel a surge of power! A chill wind …").
    // Reject it and let the sentence splitter try.
    if (r.args.some((a) => /[!?]|\w\.\s/.test(a))) r = null
  }
  if (r && r.args && r.tmpl) {
    // Rebuild with translated captures so "You see a +0 sling." does not come
    // out as "你看到 a +0 sling。". A capture that is still English (three or
    // more Latin letters) means the template cannot be completed: drop the hit
    // and keep the original line rather than print half a sentence.
    const args = r.args.map(translateCapture)
    if (args.some((a) => /[A-Za-z]{3,}/.test(a))) r = null
    else r = { out: fill(r.tmpl, args), key: r.key }
  } else if (r && r.labelTail !== undefined) {
    const translated = translatePlaceValue(r.labelTail)
    if (translated !== r.labelTail) r = { out: r.out.replace(r.labelTail, translated), key: r.key }
  }
  if (!r) {
    // Dynamic titles ("Gear: 1/52", "Casting: …") and item lists the engine
    // prints into the log ("g - a potion of magic").
    const plain = text.replace(/<[^>]*>/g, '').trim()
    const aim = translateAimLine(plain)
    if (aim) r = { out: aim, key: 'aim' }
    const title = aim ? null : matchTitle(plain)
    if (title) r = { out: title, key: 'title' }
    else if (/^\s*(?:\([^)]\)|[A-Za-z0-9*!?])\s+[-+#$]\s+/.test(plain)) {
      const item = translateItem(matcher!, plain)
      if (item) r = { out: item, key: 'item' }
    }
  }
  if (!r && text.includes('\n') && text.split('\n').length <= 8) {
    // Multi-line titles/headers: translate line by line, keep the rest.
    let changed = false
    const joined = text
      .split('\n')
      .map((line) => {
        if (!line.trim()) return line
        const one = lookup(matcher!, line, { allowLabels: true })
        if (!one) return line
        changed = true
        return one.out
      })
      .join('\n')
    if (changed) r = { out: joined, key: 'lines' }
  }
  return r ? r.out : null
}

/** Whole-string translation of a game line (message log, menu row, title). */
export function t(text: string): string {
  if (lang !== 'zh' || !matcher || !text) return text
  if (!/[A-Za-z]/.test(text)) return text
  const hit = cache.get(text)
  if (hit !== undefined) {
    // Count every occurrence of a miss, not just the first computation.
    if (hit == null) noteMiss(text)
    return hit ?? text
  }

  let out = translateOne(text)
  if (out == null) {
    // Compound messages ("The rat squeaks loudly. You hear a shout!") arrive as
    // one string. Translate all sentences or none: a partial line would be
    // half English, which the display contract forbids.
    const parts = splitSentences(text)
    if (parts.length > 1) {
      const translated = parts.map((p) => translateOne(p))
      if (translated.every((one) => one != null)) out = translated.join('')
    }
  }
  // Exclamations: "The yak gores you!" — retry the same sentence as a plain
  // statement, then put the emphasis back.
  if (out == null && /!+$/.test(text)) {
    const alt = translateOne(text.replace(/!+$/, '.'))
    if (alt != null) out = alt.replace(/。$/, '！')
  }

  cache.set(text, out ?? null)
  if (out == null) noteMiss(text)
  if (cache.size > CACHE_MAX) {
    // Cheap eviction: drop the oldest quarter (Map preserves insertion order).
    let n = CACHE_MAX / 4
    for (const k of cache.keys()) {
      cache.delete(k)
      if (--n <= 0) break
    }
  }
  return out ?? text
}

/** Item/monster names: tries the item grammar after the plain lookup. */
export function tItem(text: string): string {
  if (lang !== 'zh' || !matcher || !text) return text
  if (!/[A-Za-z]/.test(text)) return text
  const key = `item:${text}`
  const hit = cache.get(key)
  if (hit !== undefined) return hit ?? text
  let out: string | null = null
  const plainText = text.replace(/<[^>]*>/g, '').trim()
  // Inventory category rows: "Potions        (go to first with !)".
  const cat = /^(.+?)\s{2,}\(go to first with (\S)\)$/.exec(plainText)
  if (cat) {
    const head = matcher.exact.get(cat[1])
    if (head) out = `${head}（${cat[2]} 跳到第一项）`
  }
  // A row with a hotkey prefix ("g - a potion") must go through the grammar,
  // which re-attaches the prefix; the plain lookup would drop it.
  if (/^\s*(?:\([^)]\)|[A-Za-z0-9*!?])\s+[-+#$]\s+/.test(plainText)) {
    out = translateItem(matcher, plainText)
  }
  if (!out) {
    const plain = lookup(matcher, text, {})
    out = plain ? plain.out : null
  }
  if (!out) out = translateItem(matcher, plainText)
  if (!out) out = matchTitle(plainText)
  cache.set(key, out)
  return out ?? text
}

/** PocketZot's own UI strings (exact match only). */
export function tLabel(text: string): string {
  if (lang !== 'zh' || !text) return text
  const trimmed = text.trim()
  // Dynamic own-UI labels that a static dictionary cannot key.
  const del = /^Delete in (\d+)$/.exec(trimmed)
  if (del) return text.replace(trimmed, `再按 ${del[1]} 次删除`)
  const actions = /^Actions for (.+)$/.exec(trimmed)
  if (actions) return text.replace(trimmed, `${actions[1]} 的操作`)
  const hit = UI_ZH[trimmed]
  if (!hit) return text
  // Keep the surrounding whitespace so inline layouts don't collapse.
  return text.replace(trimmed, hit)
}

/**
 * True when the UI table owns this exact string — even if the mapped value is
 * identical ("English" stays "English"). Without this the game dictionary
 * would translate it ("English" → 中文, a language-menu entry).
 */
export function hasUiLabel(text: string): boolean {
  return Object.prototype.hasOwnProperty.call(UI_ZH, text.trim())
}

/** Menu-footer nav keyhelp: a closed vocabulary, applied word-wise. */
const MORE_WORDS: Array<[RegExp, string]> = [
  [/\bpage down\b/gi, '下翻页'],
  [/\bpage up\b/gi, '上翻页'],
  [/\bselect all with\b/gi, '全选：'],
  [/\btoggle selected\b/gi, '切换选择'],
  [/\bselect\b/gi, '选择'],
  [/\bdescribe\b/gi, '描述'],
  [/\bsearch\b/gi, '搜索'],
  [/\bexit\b/gi, '退出'],
  [/\bclose\b/gi, '关闭'],
  [/\bhelp\b/gi, '帮助'],
  [/\bbuy\b/gi, '购买'],
  [/\bsell\b/gi, '出售'],
  [/\btoggle\b/gi, '切换'],
  [/\bletters toggle\b/gi, '字母切换'],
]

export function tMore(text: string): string {
  if (lang !== 'zh' || !text) return text
  let out = text
  for (const [re, zh] of MORE_WORDS) out = out.replace(re, zh)
  return out
}

/** Dynamic titles (gear slots, casting, prompts) that have no dictionary key. */
export function tTitle(text: string): string {
  if (lang !== 'zh') return text
  const plain = text.replace(/<[^>]*>/g, '').trim()
  // "A six-headed hydra." — a count-word prefix + monster noun.
  const NUM: Record<string, string> = {
    one: '一', two: '二', three: '三', four: '四', five: '五',
    six: '六', seven: '七', eight: '八', nine: '九', ten: '十',
  }
  const hydra = /^(?:a|an|the)\s+(one|two|three|four|five|six|seven|eight|nine|ten)-headed hydra\.?$/i.exec(plain)
  if (hydra) return `${NUM[hydra[1].toLowerCase()]}头九头蛇`
  const feat = featureName(plain)
  if (feat) return feat
  const out = matchTitle(plain)
  if (out) return out
  // Menu-style title with the hotkey baked in: "a - a +0 robe (worn)."
  const noHot = plain.replace(/^\s*(?:\([^)]\)|[A-Za-z0-9*!?])\s+[-+#$]\s+/, '')
  const asItem = matcher && noHot !== plain ? translateItem(matcher, noHot) : null
  if (asItem) return asItem
  const direct = t(plain)
  if (direct !== plain) return direct
  // "A sky beast." / "an endoplasm" — the article is engine framing, not part
  // of the name.
  const bare = plain.replace(/^(?:a|an|the)\s+/i, '').replace(/\.\s*$/, '').trim()
  if (bare && bare !== plain) {
    const hit = t(bare)
    if (hit !== bare) return hit
  }
  return t(text)
}

export function __resetForTests(): void {
  matcher = null
  loading = null
  cache.clear()
  lang = 'en'
}
