// Build src/i18n/data/manual-zh.json from hand-written Chinese translations of
// content the 0.34.1 Chinese database does not carry (mostly DCSS 0.35
// additions). English prose is read from the upstream descript files so the
// pair keys stay byte-exact; only the Chinese lives here.
//
//   node tools/build-manual-zh.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const BASE = 'https://raw.githubusercontent.com/crawl/crawl/master/crawl-ref/source/dat/descript/'
const CATEGORIES = ['items', 'monsters', 'spells', 'features', 'unrand', 'ability', 'status', 'species', 'backgrounds']

// category → English name → [Chinese name, Chinese prose]
const T = {
  items: {
    'assassin centipede': ['刺客蜈蚣', '一种活体武器，毒爪如匕首般锋利，攻击距离很长；它的蜇刺能注入致残毒素。'],
    'centipede bauble': ['蜈蚣饰物', '一尊小蜈蚣雕像，盘绕在石头上。紧紧握住它，它就会变成活体武器。'],
    'gecko talisman': ['壁虎护身符', '一条在危急时脱落的尾巴干尸。能让使用者部分变成催眠壁虎，这种爬行动物擅于潜行。'],
    'jade talisman': ['玉护身符', '一尊用多彩玉石雕成的小雕像，散发着沉静的力量。能形成强大的元素护体。'],
    'mist talisman': ['雾护身符', '一座不断冒出烟霾的小香炉。把穿戴者的头部变成翻涌的雾罩。'],
    'my sojourns in swampland': ['我的沼泽旅居记', '自称某位著名博物学家的私人游记，读下去却会发现并非如此。'],
    'player invis desc': ['隐形描述', '隐形时，大多数怪物对你的命中大幅下降，无法借机攻击。'],
    'potion of mist': ['雾之药水', '一瓶雾气，暂时让饮用者的身体变得虚体，免受缠绕等效果。'],
    'vision talisman': ['视界护身符', '一枚眼睛形状的小护符，赋予穿戴者超自然视力。'],
    'detected item': ['探测到的物品', '你在这里探测到一个物体，但不知道它是什么。'],
  },
  monsters: {
    'acid blob': ['酸液团', '一团病态化脓的肉块，滴着致命酸液。'],
    'airy jade': ['气玉', '一块漂浮的水晶玉片，与你的气系魔法共鸣。'],
    'earthen jade': ['土玉', '一块漂浮的水晶玉片，与你的土系魔法共鸣。'],
    'fiery jade': ['火玉', '一块漂浮的水晶玉片，与你的火系魔法共鸣。'],
    'icy jade': ['冰玉', '一块漂浮的水晶玉片，与你的冰系魔法共鸣。'],
    'herald of the abyss': ['深渊先驱', '一名被深渊岁月扭曲的鲁古努信徒，已升华为被尊崇的代表。'],
    'hypnotail': ['催眠尾', '催眠壁虎脱落的尾巴，仍脉动着迷幻色彩，迫使附近的掠食者失神。'],
    'Blorkula the Orcula': ['Blorkula the Orcula', '曾是一名瘦长憔悴、痴迷色彩的吸血鬼，后来从某种力量那里获得了庇护。'],
    'Goji': ['Goji', '一只勇敢的地精，不知怎么驯服了一只鬼蛾当坐骑。'],
  },
  spells: {
    'Bolt of Antimagic spell': ['反魔法闪电', '发射一道穿透性的反魔法闪电，抽干受害者的法力。'],
    'Bolster spell': ['鼓舞', '强化施法者的肉体，大幅提高近战伤害与抗性。'],
    'Cage of Brambles spell': ['荆棘牢笼', '在附近所有敌人周围迅速长出荆棘墙；施法者的盟友可以穿过。'],
    'Dragon Veins spell': ['龙脉', '让施法者接入遍布地牢的元素地脉，引导其毁灭力量。'],
    'Ice Thorns spell': ['冰棘', '在目标敌人周围的地面长出尖锐冰棘，造成伤害。'],
    'Murky Legion spell': ['浑浊军团', '召唤一些幽暗食尸鬼，它们的一次攻击会同时散播魔法污染与浅水。'],
    'Phase Shift spell': ['相位偏移', '让施法者的身体略微偏离正常空间，使其确切位置变得模糊。'],
    'Sirocco spell': ['热风', '释放灼热狂风，烧灼至多 3 个相邻生物并将它们吹退。'],
    'Stampede spell': ['奔踏', '沿直线向敌人猛冲，每回合以双倍速度朝该方向移动。'],
    'Ufetubi Swarm spell': ['乌费图比虫群', '召唤一群狂暴的乌费图比——烦人的小恶魔，会迅速包围施法者的敌人。'],
    'Touch of Paradox spell': ['悖论之触', '将一名附近盟友从空间中解缚，赋予其“多重突击”作为天生能力。'],
  },
  features: {
    'A patch of mould': ['一片霉菌', '一层浓密多彩的霉菌，生机勃勃地沙沙作响；从中长出的高耸真菌会攻击靠近者。'],
    'a purified mutation catalyst': ['精炼变异催化剂', '一座实验性的奥术蒸馏器，正在酿造某种不完整（或许已精炼）的变异血清。打碎它会释放其中的力量。'],
    'an empty mutation catalyst': ['空的变异催化剂', '一座复杂的奥术蒸馏器，已被打碎并倒空。'],
    'an earthen dragon vein': ['土之龙脉', '一条裸露的土系地脉。踩上去可引导它，释放震波伤害周围的敌人。'],
    'a fiery dragon vein': ['火之龙脉', '一条裸露的火系地脉。踩上去可引导它，轰击 3 个敌人。'],
    'an icy dragon vein': ['冰之龙脉', '一条裸露的冰系地脉。踩上去可引导它，对 3 个敌人造成寒冷伤害。'],
    'an airy dragon vein': ['气之龙脉', '一条裸露的气系地脉。踩上去可引导它，轰击最远的 4 个敌人。'],
    'A patch of ice thorns': ['一片冰棘', '一片覆盖尖锐冰刺的地面，对任何非飞行生物造成少量伤害。'],
    'A mutagenic drain': ['变异枯竭', '一条通往锈蚀沟壑的通道。进入会施加三种临时变异。'],
    'A broken fleshy orifice': ['破损的肉质开口', '它似乎在静静渗液。最好别碰。'],
    'An assortment of trash': ['一堆垃圾', '一堆破碎腐朽的垃圾，覆满灰烬与泥土。'],
  },
  unrand: {
    'partisan of Prune': ['partisan of Prune', '普卢恩之戟带着可怕而阴险的诅咒。除非持用者保持坚定的自控，否则它可能反噬。'],
    'eveningstar "Brilliance"': ['eveningstar "Brilliance"', '堕落后不久，伊莱德莱姆努尔试图把神圣能量扭曲成自己的黑暗仿制品。'],
    'sword of the Dread Knight': ['sword of the Dread Knight', '一把精金巨剑。它的第一位持用者是一位拒绝魔法的伊莱德莱姆努尔信徒。'],
    'amulet of Tranquillity': ['amulet of Tranquillity', '一枚纯净玉石制成的吊坠，赋予穿戴者强大的意志与精神韧性。'],
    'ghost crab claws': ['ghost crab claws', '一双巨大的幽灵蟹钳，被沼泽行者 coven 制成手套用于死灵仪式。'],
    'giant spiked club "Carina at Dusk"': ['giant spiked club "Carina at Dusk"', '就连巨魔也有自己的自然诗人、眼神迷离的梦想家和饥饿的艺术家。'],
    'coolibah bardiche': ['coolibah bardiche', '一把用整棵酷栗树砍削而成的巨型长柄斧，木制刃口同样锋利。'],
    'staff of Five Virtues': ['staff of Five Virtues', '一位可敬武僧大师的法杖；她驱散敌人如同驱散执念。'],
    "Stagehand's Sword": ['Stagehand\'s Sword', '一把看似舞台道具的普通长剑。但这里一拧、那里一按，就会露出真容。'],
    "Hana's Scimitar": ['Hana\'s Scimitar', '战法师亚拉最杰出弟子之一——据传是半神——最钟爱的弯刀。'],
    'arcane splint mail': ['arcane splint mail', '一套真正古老的护甲，为最大防护与灵活性而设计，显然供施法者使用。'],
    'bone scales': ['bone scales', '骨龙半缝合（或半拆开）的躯干，被制成一件真正可穿的护甲。'],
    "Forgewarden's cuirass": ['Forgewarden\'s cuirass', '一件工艺精湛的青铜胸甲，通体刻满宗教图像。'],
  },
  ability: {
    'Pacify ability': ['安抚', '尝试安抚一个敌对生物，说服它放弃暴力。若成功，该生物会平静下来。'],
    'Divine Alms ability': ['神赐', '安抚一个受伤的友方生物，治疗其部分伤势（取决于你的祈神技能）。'],
    'Aura of Vigour ability': ['活力光环', '大幅提高你的最大生命与法力（取决于祈神技能）。'],
    'Ancestor Life: Elementalist ability': ['先祖人生：元素师', '将你的先祖记忆为元素师——强大但脆弱、能释放毁灭法术的法师。'],
  },
  status: {
    'Stampede status': ['奔踏', '你正在奔踏冲锋。任何朝敌人的移动都会将其踩退，但冲锋结束后你会疲惫。'],
    'Indom status': ['不屈', '你正在快速恢复生命（速率取决于最大生命），直到恢复指定数值。'],
    'Salvo status': ['齐射', '你接下来的数次远程攻击会向视野内其他目标额外齐射。'],
    'Tailwind status': ['顺风', '你的下一次“暴走”移动将是瞬间的。'],
    'Exegesis status': ['释经', '你刚使用过神谕阐释，可大幅降低虔诚消耗重复同一法术。'],
    '-Jolt status': ['电击耗尽', '你刚释放过满功率电击，在完全恢复前无法再次使用。'],
    '-Sirocco status': ['热风耗尽', '你刚施放过热风，在连续数回合不移动前无法再次施放。'],
    'Vision status': ['视界', '你的第三只眼睁开，能看见施法残留的魔力并转化为力量。'],
    'Jade status': ['玉甲', '元素水晶覆盖你的上半身，提升元素魔法技能与防护。'],
    'Crystals status': ['水晶', '你身上的玉甲水晶数量。'],
    'Gecko status': ['壁虎', '你是催眠壁虎，一种能在大伤时断尾作为诱饵的隐秘蜥蜴。'],
    '-Tail status': ['断尾', '你刚断尾，需要探索更多地牢才能重新长出。'],
    'Insubst status': ['虚体', '你的身体虚体化，免疫缠绕、石化、倒刺、黏性火焰、蛛网等。'],
    'Vapour status': ['蒸汽', '刚喝下的药水化作气体在你体内翻涌；下一次近战会喷出云雾。'],
    'Mistmane status': ['雾鬃', '你的头是一团翻涌的雾；喝下的药水会代谢成有害气体。'],
  },
  species: {
    'Gale Centaur': ['疾风半人马', '强壮的半人马混血种，自称血脉可追溯至四方之风；疾风半人马在向敌人疾驰冲锋时最为强大。'],
  },
  backgrounds: {
    'Mystic': ['秘法师', '秘法师用护符改造身体，以更契合魔法；其法术需要机动性。'],
    'Stalker': ['潜猎者', '潜猎者用护符改造身体，以更好地欺骗和削弱敌人；最终能隐匿于暗影。'],
  },
}

function parse(text) {
  const out = {}
  for (const block of text.split(/^%%%%\s*$/m)) {
    const lines = block.replace(/^\r?\n/, '').split(/\r?\n/)
    const name = (lines.shift() ?? '').trim()
    if (!name || name.startsWith('#') || name.startsWith('__')) continue
    out[name] = lines.filter((l) => !l.trim().startsWith('#')).join('\n').trim()
  }
  return out
}

const names = {}
const pairs = {}
let missing = 0
for (const cat of CATEGORIES) {
  const r = await fetch(BASE + cat + '.txt')
  if (!r.ok) { console.log(cat, 'HTTP', r.status); continue }
  const en = parse(await r.text())
  for (const [name, [zhName, zhProse]] of Object.entries(T[cat] ?? {})) {
    const p = en[name]
    if (!p) { console.log('missing upstream entry:', cat, name); missing++; continue }
    if (zhName !== name) {
      names[name] = zhName
      // Display surfaces (Casting, ability menu, status rows) use the bare name.
      const bare = name.replace(/\s+(spell|ability|status)$/i, '')
      if (bare !== name) names[bare] = zhName
    }
    pairs[p.replace(/\s+/g, ' ').trim()] = zhProse
  }
}
const out = `// Generated by tools/build-manual-zh.mjs — hand-written Chinese for content
// the 0.34.1 database lacks (DCSS 0.35 additions).
export const MANUAL_NAMES: Record<string, string> = ${JSON.stringify(names, null, 2)}

export const MANUAL_PROSE: Record<string, string> = ${JSON.stringify(pairs, null, 2)}
`
writeFileSync('src/i18n/manual-zh.ts', out)
console.log(`names=${Object.keys(names).length} pairs=${Object.keys(pairs).length} upstream-missing=${missing}`)
