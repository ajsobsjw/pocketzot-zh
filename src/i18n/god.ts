import { isZh, t } from './index'
import { zhCost } from '../views/menu-columns'

const POWERS: Record<string, string> = {
  'Your life essence is reduced. (-10% HP)': '你的生命精华减少。（生命值 -10%）',
  'You can recall your ancestor.': '你可以召回你的先祖。',
  'You can stack five cards from your decks.': '你可以从牌组中排列五张牌。',
  'You can perform airborne attacks.': '你可以发动空中攻击。',
  'You can surround yourself with impenetrable night, twice.': '你可以两次用无法穿透的黑夜包围自己。',
  'Godly wrath is upon you!': '神罚已降临到你身上！',
  "You've transgressed heavily! Be penitent!": '你犯下了严重的过错！忏悔吧！',
  'You are under penance.': '你正在赎罪。',
  'You should show more discipline.': '你应该更加自律。',
  'You can recruit apostles that you defeat into your service.': '你可以招募被你击败的使徒为你效力。',
  'Your apostles are sometimes healed when you deal damage.': '你造成伤害时，有时会治疗你的使徒。',
  'Your shadow sometimes tangibly mimics your actions.': '你的影子有时会实体化并模仿你的行动。',
  'Your enemies may become distracted by gold.': '你的敌人可能会因金币而分心。',
  'You adapt resistances upon receiving elemental damage.': '受到元素伤害时，你会获得对应的抗性。',
  'Jellies are peaceful and will consume items off the floor.': '果冻对你保持和平，并会吞食地上的物品。',
  'Jiyva prevents you from harming jellies.': '吉瓦阻止你伤害果冻。',
  'You are surrounded by an umbra.': '你被暗影笼罩。',
  'Your Destruction is augmented by the power of Gehenna.': '地狱火之狱的力量强化了你的毁灭神力。',
  "You can memorise some of Vehumet's spells.": '你可以记忆维胡梅特赐予的部分法术。',
}

const FAVOUR: Array<[RegExp, (god: string) => string]> = [
  [/^A prized avatar of (.+)\.$/, (god) => `你是${god}器重的化身。`],
  [/^A favoured servant of (.+)\.$/, (god) => `你是${god}宠爱的仆从。`],
  [/^A glorious shadow in the eyes of (.+)\.$/, (god) => `在${god}眼中，你已成为荣耀的暗影。`],
  [/^A shining star in the eyes of (.+)\.$/, (god) => `在${god}眼中，你是一颗闪耀的星辰。`],
  [/^A rising shadow in the eyes of (.+)\.$/, (god) => `在${god}眼中，你是一道崭露头角的暗影。`],
  [/^A rising star in the eyes of (.+)\.$/, (god) => `在${god}眼中，你是一颗冉冉升起的新星。`],
  [/^(.+) is pleased with you\.$/, (god) => `${god}对你感到满意。`],
  [/^(.+) is aware of your devotion\.$/, (god) => `${god}察觉到了你的虔诚。`],
  [/^(.+) is noncommittal\.$/, (god) => `${god}对你不置可否。`],
  [/^(Cheibriados) supports your attributes\. \(\+\d+\)$/, (god) => `${god}强化了你的属性。`],
]

function dynamicGodLine(text: string): string | null {
  const regen = /^Your health and magic regeneration is (?:(very greatly|greatly) )?accelerated\.$/.exec(text)
  if (regen) return `你的生命和法力回复速度${regen[1] === 'very greatly' ? '显著' : regen[1] ? '大幅' : ''}加快。`
  const aura = /^You radiate a(?:( large| small))? righteous aura, and foes within it are easier to hit\.$/.exec(text)
  if (aura) return `你散发着${aura[1] === ' large' ? '大范围的' : aura[1] ? '小范围的' : ''}正义光环，光环内的敌人更容易被击中。`
  for (const [pattern, render] of FAVOUR) {
    const match = pattern.exec(text)
    if (!match) continue
    const name = match[1] === 'The Shining One' ? 'the Shining One' : match[1]
    const god = t(name)
    if (god !== name) return render(god) + (text.match(/ \(\+\d+\)$/)?.[0] ?? '')
  }
  return null
}

export function translateGodServiceFee(text: string): string {
  const fee = /^\s*\((\d+) gold; you have (\d+)\)$/.exec(text)
  if (fee) return `（费用 ${fee[1]} 金币，现有 ${fee[2]} 金币）`
  if (/^\s*\(no fee if you (?:act now|join today)\)$/.test(text)) return '（现在加入免服务费）'
  return text
}

/** Translate a complete coloured power row without changing its colour or indentation. */
export function translateGodLine(line: string): string {
  if (!isZh()) return line
  const match = /^((?:<[^>]+>)*)(\s*)(.*?)(\s*)((?:<\/[^>]+>)*)$/.exec(line)
  if (!match || /<[^>]+>/.test(match[3])) return line
  const text = match[3]
  const cost = /^\((.*)\)$/.exec(text)
  const translated = cost ? zhCost(cost[1]) : POWERS[text] ?? dynamicGodLine(text) ?? t(text)
  if (!translated || translated === text) return line
  return match[1] + match[2] + (cost ? `（${translated}）` : translated) + match[4] + match[5]
}
