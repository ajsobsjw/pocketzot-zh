// Display copies only. Never feed translated help, search tokens or terminal
// rows back to the engine. Keep the number of rows stable for scroll messages.
import { isZh, t, tItem } from './index'
import { lookupProse } from './describe'

const HELP: Record<string, string> = {
  'Dungeon Crawl Help': '地下城探索帮助',
  'Manual Contents': '手册目录',
  'Press one of the following keys to': '按下列按键，查看地下城探索',
  'obtain more information on a certain': '对应主题的详细说明。',
  'aspect of Dungeon Crawl.': '',
  'Table of contents': '目录', 'Overview': '总览',
  'Starting Screen': '开始界面', 'Attributes and Stats': '属性与数值',
  'Exploring the Dungeon': '探索地下城', 'Experience and Skills': '经验与技能',
  'Monsters': '怪物', 'Items': '物品', 'Spellcasting': '施法',
  'Targeting': '瞄准', 'Religion': '宗教', 'Mutations': '突变',
  'Licence, Contact, History': '许可、联系与历史',
  'Macros, Options, Performance': '宏、选项与性能', 'Philosophy': '设计理念',
  'List of Character Species': '角色种族列表',
  'List of Character Backgrounds': '角色职业列表',
  'List of Skills': '技能列表', 'List of Keys and Commands': '按键与命令列表',
  'Inscriptions': '铭文', 'Dungeon sprint modes': '地下城冲刺模式',
  'List of commands': '命令列表', 'Quickstart Guide': '快速入门',
  'Browse character notes': '浏览角色笔记', 'Browse character dump': '浏览角色记录',
  'Macros help': '宏帮助', 'Options help': '选项帮助',
  'Table of aptitudes': '资质表', 'Lookup description': '查询说明',
  'FAQ': '常见问题', 'Version information': '版本信息',
  'Display diagnostics': '显示诊断信息', 'This screen': '本页',
  'Interlevel Travel (choose a branch):': '跨层旅行（选择分支）：',
  'Use the shortcut letter for a branch to select the branch for travel.': '按分支的快捷字母，选择旅行目的分支。',
  'Once you select a branch, you will be prompted for a depth in that': '选定分支后，游戏会询问目的层数。',
  'branch (more help is available there).': '届时还可查看进一步帮助。',
  'Repeat last interlevel travel.': '重复上次跨层旅行。',
  'Travel to a level in the current branch.': '前往当前分支的指定层。',
  'Go up the nearest stairs.': '从最近的楼梯上楼。',
  'Go down the nearest stairs.': '从最近的楼梯下楼。',
  'Travel to a level in the branch above this one.': '前往上级分支的指定层。',
  'Show available waypoints (if any are set).': '显示已设置的路径点。',
  'Go to the numbered waypoint.': '前往对应编号的路径点。',
  'Show available altars (if any are discovered).': '显示已发现的祭坛。',
}

function cell(text: string): string {
  const trimmed = text.trim()
  if (!trimmed || !/[A-Za-z]/.test(trimmed)) return text
  // Engine-facing inscription and search syntax must remain verbatim.
  if (/^(?:Stash search prefixes|Menu\/colouring prefixes):/.test(trimmed)) return text
  const direct = HELP[trimmed]
  if (direct !== undefined) return direct
  const keyHelp = /^(\S+\s*[:.]\s*)(.+)$/.exec(trimmed)
  if (keyHelp) {
    const body = HELP[keyHelp[2]] ?? t(keyHelp[2])
    if (body !== keyHelp[2]) return keyHelp[1] + body
  }
  const colon = /^(:\s*)(.+)$/.exec(trimmed)
  if (colon && HELP[colon[2]]) return colon[1] + HELP[colon[2]]
  return lookupProse(trimmed) ?? t(trimmed)
}

function width(s: string): number {
  return [...s].reduce((n, c) => n + (c.charCodeAt(0) > 255 ? 2 : 1), 0)
}

/** Plain text only: callers strip DCSS/HTML before passing a display copy. */
export function translatePage(text: string): string {
  if (!isZh()) return text
  const whole = lookupProse(text) ?? t(text)
  if (whole !== text) return whole
  // Prose dictionaries contain paragraphs, whereas manual/scroller messages
  // contain multiple paragraphs and may wrap every sentence at 80 columns.
  const blocks = text.split(/(\n[ \t]*\n)/)
  if (blocks.length > 1) {
    return blocks.map((block, i) => i % 2 ? block : translatePage(block)).join('')
  }
  return text.split('\n').map((line) => {
    const keyed = /^(\s*\S*\s*:\s*)(.+)$/.exec(line)
    if (keyed && HELP[keyed[2]]) return keyed[1] + HELP[keyed[2]]
    const parts = line.split(/(\s{2,})/)
    if (parts.length === 1) return cell(line)
    let out = ''
    let sourceColumn = 0
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      sourceColumn += width(part)
      if (i % 2) out += ' '.repeat(Math.max(1, sourceColumn - width(out)))
      else out += cell(part)
    }
    return out
  }).join('\n')
}

/** Conservative terminal fallback for isolated species/item rows. */
export function translateTerminalLine(text: string): string {
  const page = translatePage(text)
  if (page !== text) return page
  const entry = /^(\s*[A-Za-z0-9]\s+[-+.)]\s+)([^\d]+?)(\s{2,}.*)?$/.exec(text)
  if (!entry) return text
  const name = tItem(entry[2].trim())
  return name !== entry[2].trim() ? entry[1] + name + (entry[3] ?? '') : text
}
