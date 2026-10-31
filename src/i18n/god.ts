import { isZh, t } from './index'
import { zhCost } from '../views/menu-columns'

const POWERS: Record<string, string> = {
  'Your life essence is reduced. (-10% HP)': '你的生命精华减少。（生命值 -10%）',
  'You can recall your ancestor.': '你可以召回你的先祖。',
  'You can stack five cards from your decks.': '你可以从牌组中排列五张牌。',
  'You can perform airborne attacks.': '你可以发动空中攻击。',
  'You can surround yourself with impenetrable night, twice.': '你可以两次用无法穿透的黑夜包围自己。',
}

/** Translate a complete coloured power row without changing its colour or indentation. */
export function translateGodLine(line: string): string {
  if (!isZh()) return line
  const match = /^((?:<[^>]+>)*)(\s*)(.*?)(\s*)$/.exec(line)
  if (!match || /<[^>]+>/.test(match[3])) return line
  const text = match[3]
  const cost = /^\((.*)\)$/.exec(text)
  const translated = cost ? zhCost(cost[1]) : POWERS[text] ?? t(text)
  if (!translated || translated === text) return line
  return match[1] + match[2] + (cost ? `（${translated}）` : translated) + match[4]
}
