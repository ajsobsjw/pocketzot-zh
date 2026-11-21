// Display copies only. Never feed translated help, search tokens or terminal
// rows back to the engine. Keep the number of rows stable for scroll messages.
import { isZh, t, tItem } from './index'
import { lookupProse } from './describe'
import { GRID_MARK, CELL_SEP } from '../views/overlay-body'

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

function translateCell(text: string): string {
  const whole = cell(text)
  if (whole !== text) return whole
  // History pages often join several independently translated combat messages
  // into one terminal row. Translate only when every sentence has a match.
  const flat = text.replace(/\n/g, ' ')
  const parts = flat.split(/(?<=[.!?])\s+(?=[<A-Z0-9"“'])/)
  if (parts.length < 2) return whole
  const translated = parts.map((part) => {
    const result = cell(part)
    return result === part ? null : result
  })
  return translated.every((part): part is string => part !== null)
    ? translated.join('')
    : whole
}

/** Plain text only: callers strip DCSS/HTML before passing a display copy. */
export function translatePage(text: string): string {
  if (!isZh()) return text
  const whole = lookupProse(text)
  if (whole !== null) return whole
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
    if (parts.length === 1) return translateCell(line)
    let out = ''
    let sourceColumn = 0
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      sourceColumn += width(part)
      if (i % 2) out += ' '.repeat(Math.max(1, sourceColumn - width(out)))
      else out += translateCell(part)
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

const OVERVIEW_BRANCH_ZH: Record<string, string> = {
  Dungeon: '地牢',
  Temple: '神殿',
  Lair: '兽巢',
  Swamp: '沼泽',
  Shoals: '浅滩',
  Snake: '蛇穴',
  Spider: '蛛巢',
  Slime: '泥坑',
  Orc: '兽人矿坑',
  Elf: '精灵大厅',
  Vaults: '宝库',
  Crypt: '地窖',
  Tomb: '古墓',
  Depths: '深渊之境',
  Hell: '地狱',
  Dis: '狄斯',
  Geh: '欣嫩谷',
  Gehenna: '欣嫩谷',
  Coc: '哀叹河',
  Cocytus: '哀叹河',
  Tar: '塔耳塔洛斯',
  Tartarus: '塔耳塔洛斯',
  Zot: '佐特领域',
  Abyss: '深渊',
  Pan: '万魔殿',
  Pandemonium: '万魔殿',
  Zig: '通天塔',
  Ziggurat: '通天塔',
  Arena: '竞技场',
  Gauntlet: '试炼场',
  Bailey: '堡垒',
  Bazaar: '集市',
  IceCv: '冰窟',
  Ossuary: '藏骨堂',
  Sewer: '下水道',
  Trove: '藏宝室',
  Volcano: '火山',
  WizLab: '法师实验室',
  Desolation: '荒芜之地',
  Necropolis: '死灵之城',
}

function translateOverviewCell(cell: string): string {
  return cell.split(/(<[^>]+>)/).map((part) => {
    if (!part || part.startsWith('<')) return part
    const lead = part.slice(0, part.length - part.trimStart().length)
    const trail = part.slice(part.trimEnd().length)
    const core = part.trim()
    if (!core || !/[A-Za-z]{3}/.test(core)) return part
    if (core === 'Zot:') return `${lead}佐特:${trail}`
    if (OVERVIEW_BRANCH_ZH[core]) return `${lead}${OVERVIEW_BRANCH_ZH[core]}${trail}`
    // Leave compact branch coordinates ("D:9", "Lair:2") and shop glyph groups intact.
    if (/^[A-Za-z]+:\d+/.test(core)) return part
    const zh = t(core)
    if (zh !== core) return `${lead}${zh}${trail}`
    const item = tItem(core)
    return item !== core ? `${lead}${item}${trail}` : part
  }).join('')
}

function translateOverviewHeaderLine(line: string): string {
  let out = line
    .replace(/\bDungeon Overview and Level Annotations\b/, '地牢总览与层级标注')
    .replace(/\bBranches:/, '分支：')
    .replace(/\bAltars:/, '祭坛：')
    .replace(/\bShops:/, '商店：')
    .replace(/\bPortals:/, '传送门：')
    .replace(/\bAnnotations:/, '标注：')
    .replace(
      /\(press (<[^>]+>G<[^>]+>) to reach them and (<[^>]+>\?\/b<[^>]+>) for more information\)/i,
      '（按 $1 前往，按 $2 查看更多信息）',
    )
    .replace(
      /\(press (<[^>]+>Ctrl-F<[^>]+>) "altar" to reach them and (<[^>]+>\?\/g<[^>]+>) for more information\)/i,
      '（按 $1 搜索 "altar" 前往，按 $2 查看更多信息）',
    )
    .replace(
      /\(press (<[^>]+>Ctrl-F<[^>]+>) "shop" to reach them\)/i,
      '（按 $1 搜索 "shop" 前往）',
    )
    .replace(
      /\(press (<[^>]+>!<[^>]+>) to add a new annotation\)/i,
      '（按 $1 添加新标注）',
    )
    .replace(/\bThe Realm of Zot is guarded by ([^.<]+)\./, (_all, mon: string) => {
      const zh = tItem(mon.trim())
      return `佐特领域由${zh}守卫。`
    })
  if (out !== line) return out
  // Single non-grid line (e.g. a portal or note entry): preserve colour tags when
  // possible, otherwise fall back to translatePage on tagless lines.
  if (!/<[^>]+>/.test(line)) return translatePage(line)
  return line
}

/**
 * Translate a reflowed Ctrl-O Dungeon Overview while preserving every DCSS
 * colour tag and GRID_MARK/CELL_SEP layout marker.
 */
export function translateOverviewMarkup(text: string): string {
  if (!isZh() || !text) return text
  return text.split('\n').map((line) => {
    if (line.startsWith(GRID_MARK)) {
      const [kind, ...cells] = line.slice(GRID_MARK.length).split(CELL_SEP)
      return GRID_MARK + kind + CELL_SEP + cells.map(translateOverviewCell).join(CELL_SEP)
    }
    return translateOverviewHeaderLine(line)
  }).join('\n')
}
