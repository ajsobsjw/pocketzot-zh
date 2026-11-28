import { isZh, t, tItem } from './index'
import { translatePlayerTitle } from './char-overview'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DATE = '[A-Z][a-z]+ \\d{1,2}, \\d{4}'

function date(raw: string): string {
  const [month, day, year] = raw.split(/[, ]+/)
  const n = MONTHS.indexOf(month.slice(0, 3)) + 1
  return n ? `${year}年${n}月${day}日` : raw
}

function namedCombo(raw: string): string {
  const all = tItem(raw)
  if (all !== raw) return all
  for (const match of raw.matchAll(/ /g)) {
    const left = raw.slice(0, match.index)
    const right = raw.slice(match.index + 1)
    const a = tItem(left), b = tItem(right)
    if (a !== left && b !== right) return `${a}${b}`
  }
  return raw
}

function place(raw: string): string {
  const level = /^on level (\d+) of (?:the )?(.+)$/.exec(raw)
  if (level) return `${tItem(level[2])}第${level[1]}层`
  const branch = /^in (?:the )?(.+)$/.exec(raw)
  return branch ? tItem(branch[1]) : raw
}

function line(raw: string): string {
  if (/^Best Crawlers\s*-?$/.test(raw)) return '排行榜 -'
  const head = /^(\d+ .+?) \(level (\d+)(?:, (-?\d+\/\d+(?: \(\d+\))?) HPs?)?\)(.*)$/.exec(raw)
  if (head) {
    const identity = /^(\d+ \S+) (the .+)$/.exec(head[1])
    const title = identity ? translatePlayerTitle(identity[2]) : ''
    const who = identity ? `${identity[1]} ${title}` : head[1]
    return `${who}（${head[2]}级${head[3] ? `，生命 ${head[3]}` : ''}）${head[4]}`
  }
  const began = new RegExp(`^Began as an? (.+?) on (${DATE})\\.$`).exec(raw)
  if (began) return `于${date(began[2])}以${namedCombo(began[1])}开始冒险。`
  const lasted = /^The game lasted (?:(\d+) days? )?(\d+:\d\d:\d\d) \((\d+) turns?\)\.$/.exec(raw)
  if (lasted) return `用时 ${lasted[1] ? `${lasted[1]}天 ` : ''}${lasted[2]}（${lasted[3]} 回合）。`
  const quit = new RegExp(`^Quit the game(?:( (?:on level|in) .+?))?(?: on (${DATE}))?\\.$`).exec(raw)
  if (quit) return `${quit[2] ? `于${date(quit[2])}` : ''}${quit[1] ? `在${place(quit[1].trim())}` : ''}放弃了游戏。`
  const orb = /^(?:(\d+\.\s+\d+\s+.+?) )?escaped with the Orb([.!]?)$/i.exec(raw)
  if (orb) return `${orb[1] ? `${orb[1]} ` : ''}携佐特之球逃离${orb[2] === '!' ? '！' : orb[2] ? '。' : ''}`
  const runes = /^(?:\.\.\.|…) and (\d+) runes?!$/.exec(raw)
  if (runes) return `……并带走了 ${runes[1]} 枚符文！`
  const death = /^(Slain|Killed|Mangled|Blasted|Demolished) by (?:an? |the )?(.+?)([.!])?$/.exec(raw)
  if (death && !/[<>]/.test(death[2])) {
    const target = tItem(death[2])
    if (target !== death[2]) return `被${target}杀死${death[3] ? '。' : ''}`
  }
  const god = /^Was (?:an? |the )?(.+?) of (.+?)\.$/.exec(raw)
  if (god) {
    const rank = t(god[1]), name = tItem(god[2])
    if (rank !== god[1] && name !== god[2]) return `是${name}的${rank}。`
  }
  return raw
}

/** Only the displayed scorecard is translated; score files and records stay intact. */
export function translateGameOver(text: string): string {
  if (!isZh()) return text
  return text.replace(/^(\t* *)\S[^\r\n]*/gm, (raw, indent: string) => {
    const trimmed = raw.trim()
    const out = line(trimmed)
    return out === trimmed ? raw : indent + out + raw.slice(raw.trimEnd().length)
  })
}
