// Build src/i18n/manual-zh.ts from hand-written Chinese translations of
// content the 0.34.1 Chinese database does not carry (mostly DCSS 0.35
// additions). English prose is read from the upstream descript files so the
// pair keys stay byte-exact; only the Chinese lives here.
//
// Translations are complete: every paragraph (including rules and exceptions)
// is rendered, not summarised. Entries whose upstream text contains mako
// {{ … }} are expanded into their resolved variants below, because the wire
// text the client receives has already been resolved.
//
//   node tools/build-manual-zh.mjs
import { writeFileSync } from 'node:fs'

const BASE = 'https://raw.githubusercontent.com/crawl/crawl/master/crawl-ref/source/dat/descript/'
const CATEGORIES = ['items', 'monsters', 'spells', 'features', 'unrand', 'ability', 'status', 'species', 'backgrounds']

// category → English name → [Chinese name, Chinese prose]
const T = {
  items: {
    'assassin centipede': ['刺客蜈蚣', '一件活体武器，毒爪如匕首般锋利，攻击距离很长。它的蜇刺能向被击中的目标注入致残毒素；附魔等级较高时，甚至能让敌人短暂减速或麻痹。用它进行一定次数的攻击后，它会脱离你的身体，独立攻击敌人一小段时间，随后死去。'],
    'centipede bauble': ['蜈蚣饰物', '一尊小蜈蚣雕像，盘绕在石头上。紧紧握住它，它就会变成一件与持用者身体融合的活体武器。这件武器是一把具有攻击距离的短刃，其攻击能使目标中毒。用它进行一定次数的攻击后，它会脱离持用者的身体，作为独立盟友与你并肩作战一小段时间，随后死去。变形术技能会提升这条蜈蚣在武器与虫形态下的力量，以及毒素的效力——最终甚至能让它偶尔减速或麻痹敌人。'],
    'gecko talisman': ['壁虎护身符', '一条在危急时脱落的尾巴干尸。能让使用者部分变成催眠壁虎——一种变色能力极强的爬行动物。它们的皮肤会随环境自然变色，使它们擅于潜行；受重伤时，它们会反射性地断掉自己的尾巴，并让断尾闪耀鲜艳色彩作为诱饵，从而得以逃跑，甚至从盲区袭击被分心的掠食者。'],
    'jade talisman': ['玉护身符', '一尊用多彩玉石雕成的小雕像，散发着沉静的力量。它会让穿戴者的头部与上半身长出一层巨大的元素水晶护体，提升其火焰、寒冰、大地与空气魔法的本领，但削弱其他所有学派。每当穿戴者施放这四系之一的法术，相应的水晶就会充能，并释放一阵破坏性魔法。若四块水晶同时充能，穿戴者的抗性与坚韧会暂时增强。'],
    'mist talisman': ['雾护身符', '一座不断冒出无尽烟霾的小香炉。它会把穿戴者的头部变成一团翻涌的雾罩。在这种形态下喝下的任何药水都会迅速分解为气体，穿戴者可以在近战攻击时将其作为有害云雾喷出。穿戴者还能缓慢地把地牢中的空气凝结成雾之药水，从而变为虚体并致盲怪物。然而，缺少正常的嘴部结构使吟唱变得困难，大幅降低施法速度。'],
    'my sojourns in swampland': ['我的沼泽旅居记', '这本书自称某位著名博物学家的私人游记，但读下去就会发现它是从多个互不相关的来源汇编而成，其中包括一个巡回魔法马戏团舞台工作人员的笔记。游记或许是虚构的，但页边仔细抄录的一些法术图解似乎相当真实。'],
    'player invis desc': ['隐形描述', '隐形时，大多数怪物对你的命中率大幅下降，无法进行借机攻击，它们施放的法术有时也会瞄准错误的位置。它们还可能四处踉跄，并最终跟丢你，尤其是在智力较低时。此外，你对这些生物发动的近战攻击有几率（与你的潜行和武器技能成正比）打得它们措手不及并造成额外伤害，使用短刃时尤其如此。某些生物能看穿这种隐形；站在水中时隐形也始终完全无效。'],
    'potion of mist': ['雾之药水', '一瓶雾气，能暂时让饮用者的身体变得虚体，保护其免受缠绕、石化、倒刺、黏性火焰、蛛网、捕网以及被流星锤缠住的影响。如果已经受到这些效果影响，它也会解除其中大部分。'],
    'vision talisman': ['视界护身符', '一枚眼睛形状的小护符。它赋予穿戴者超自然视力，使其能看见生物施法后残留的魔力云雾。触碰这些云雾，穿戴者就能把残留的魔力转化为射向附近敌人的必中投射物。这只第三只眼甚至能让穿戴者看得比原本更远，但要注意——被你这样看见的生物也能反过来看见你。'],
    'detected item': ['探测到的物品', '你在这里探测到一个物体，但不知道它是什么。'],
  },
  monsters: {
    'acid blob': ['酸液团', '一团病态化脓的肉块，滴着致命酸液。'],
    'airy jade': ['气玉', '一块漂浮的水晶玉片，与你的气系魔法共鸣。'],
    'earthen jade': ['土玉', '一块漂浮的水晶玉片，与你的土系魔法共鸣。'],
    'fiery jade': ['火玉', '一块漂浮的水晶玉片，与你的火系魔法共鸣。'],
    'icy jade': ['冰玉', '一块漂浮的水晶玉片，与你的冰系魔法共鸣。'],
    'herald of the abyss': ['深渊先驱', '一名被深渊岁月扭曲的鲁古努信徒，已升华为鲁古努对世间万物之憎恨的尊崇代表，以鲁古努之名庄严地撕碎现实。'],
    'hypnotail': ['催眠尾', '催眠壁虎脱落的尾巴，仍脉动着迷幻色彩，迫使附近的掠食者把注意力集中在它身上，而不是它生前所属的那只不幸蜥蜴。'],
    'Blorkula the Orcula': ['Blorkula the Orcula', '布洛库拉曾是一名瘦长憔悴、痴迷色彩的吸血鬼；在比欧弗的一位传教士给予他帮助后，他变成了一名矮胖健壮的兽人，却依然痴迷色彩。他挥舞着染有彩虹每一种色调的魔法，并掌握了将自己的形体分散到诸多色彩中以避开致命一击的技艺——不过即便是他，也要休息一段时间才能再次这么做。'],
    'Goji': ['Goji', '一只勇敢的地精，不知怎么驯服了一只鬼蛾当坐骑。他用复杂的绳结把自己固定在蛾背上，这无疑削弱了鬼蛾本身的机动性；但即便被束缚的鬼蛾也可能是致命的对手。而戈吉呢？他也在这儿。'],
  },
  spells: {
    'Bolt of Antimagic spell': ['反魔法闪电', '发射一道穿透性的、在本体论上自相矛盾的反魔法闪电，抽干受害者的魔力储备。'],
    'Bolster spell': ['鼓舞', '强化施法者的肉体，大幅提高其近战伤害以及对所有元素的抗性。'],
    'Cage of Brambles spell': ['荆棘牢笼', '在附近所有敌人周围迅速长出荆棘墙。施法者的盟友可以毫无阻碍地穿过荆棘发射投射物，但其他人想清除它们可就痛苦了。'],
    'Dragon Veins spell': ['龙脉', '让施法者接入遍布地牢的元素能量地脉，引导其毁灭之力攻击敌人。施放后，相邻地砖上会显现至多四条龙脉——分别对应火焰、寒冰、空气与大地魔法。踩上任意一条都会立即触发一次毁灭性施法，消耗 1 点魔力，最多随机瞄准 3 个敌人，并附带一种取决于所引导元素的额外效果：火（西）：优先瞄准生命值最低的敌人，击杀目标后会留下短暂的火焰云雾；冰（东）：优先瞄准生命值最高的敌人，短暂冻结它们，使其移动变慢；气（北）：优先瞄准距离最远的敌人，与其他三种元素不同，即使对远处目标也能造成全额伤害；土（南）：优先瞄准最近的敌人，少攻击一个目标，且对飞行生物造成的伤害大幅降低，但近距离被击中的敌人可能会踉跄。法术失效前，你至多可以从两条龙脉中引导力量。'],
    'Ice Thorns spell': ['冰棘', '在目标敌人周围的地面长出尖锐的冰棘。这些冰棘会伤害任何踩上去的非飞行生物，然后碎裂消失。施法者可以踩在自己的冰棘上而不受伤（但踩上去时它们仍会碎裂）。'],
    'Murky Legion spell': ['浑浊军团', '召唤一些幽暗食尸鬼；它们会在消失前以一次攻击同时散播魔法污染与浅水。'],
    'Phase Shift spell': ['相位偏移', '让施法者的身体略微偏离正常空间，使其确切位置变得模糊不清。任何没有超自然敏锐视力的攻击者都更难命中他们，也无法判断其受伤程度。'],
    'Sirocco spell': ['热风', '释放一阵灼热狂风，烧灼至多 3 个相邻生物并将它们吹退。可惜，那些在生物周围盘旋的反复无常的风也会在之后数回合加速它们的移动。此法术数回合内无法再次施放，移动会延长其充能时间。'],
    'Stampede spell': ['奔踏', '沿直线向敌人猛冲。此后每回合，使用者都会朝该方向以双倍速度移动，以更高的伤害与命中攻击路径上的任何敌人并将其击退，直到无法移动或冲过了目标。只有目标位于使用者所在的正方向时才能使用。'],
    'Ufetubi Swarm spell': ['乌费图比虫群', '召唤一群狂暴的乌费图比——一群烦人的小恶魔，它们会迅速蜂拥包围施法者的敌人。'],
    'Touch of Paradox spell': ['悖论之触', '将一名附近盟友从空间中解缚，赋予其“多重突击”作为天生能力（使其能以一次无法失手的近战攻击打击多个远处敌人），并使其在使用该能力时有机会闪现。'],
  },
  features: {
    'A patch of mould': ['一片霉菌', '一层浓密多彩的霉菌，生机勃勃地沙沙作响。从中长出的高耸真菌能在眨眼间重新长出，无论被砍倒多少次。'],
    'a purified mutation catalyst': ['精炼变异催化剂', '一座实验性的奥术蒸馏器，正在酿造某种不完整——或许已精炼——的变异血清。打碎它会让你沐浴在神秘雾气中，赋予你一项有益变异（不包括可能限制装备栏位的变异）。'],
    'an empty mutation catalyst': ['空的变异催化剂', '一座复杂的奥术蒸馏器，已被打碎并倒空其中内容。'],
    'an earthen dragon vein': ['土之龙脉', '一条裸露的土系地脉。踩上去可引导它，释放震波伤害最近的 2 个敌人。对远处和飞行敌人造成的伤害大幅降低。'],
    'a fiery dragon vein': ['火之龙脉', '一条裸露的火系地脉。踩上去可引导它，以火焰轰击生命值最低的 3 个敌人。被此效果杀死的敌人会短暂留下火焰云雾。'],
    'an icy dragon vein': ['冰之龙脉', '一条裸露的冰系地脉。踩上去可引导它，对生命值最高的 3 个敌人造成寒冷伤害，并短暂减速它们的移动。'],
    'an airy dragon vein': ['气之龙脉', '一条裸露的气系地脉。踩上去可引导它，以切割之风轰击最远的 4 个敌人。'],
    'A patch of ice thorns': ['一片冰棘', '一片覆盖尖锐冰刺的地面。它会对任何踩上去的非飞行生物（其创造者除外）造成少量伤害，然后碎裂消失。其伤害会被寒冷抗性部分减免。'],
    'A mutagenic drain': ['变异枯竭', '一条通往锈蚀沟壑的通道，正逐渐锈蚀消失。进入会对你施加三种临时变异；如果你是亡灵，则会分解你。'],
    'A broken fleshy orifice': ['破损的肉质开口', '它似乎在静静渗液。最好别碰。'],
    'An assortment of trash': ['一堆垃圾', '一堆破碎腐朽的垃圾，覆满灰烬与泥土。'],
  },
  unrand: {
    'partisan of Prune': ['partisan of Prune', '普卢恩之戟带着可怕而阴险的诅咒。除非持用者保持坚定的自控，否则注定会经历一次可怕（尽管是暂时的）变形。通常抵抗它轻而易举，但无力化的持用者必定屈服，会发现自己变成噩梦般的紫色、软塌塌又美味的样子。他们可以欣慰地得知：要弄伤一个巨大的西梅干出乎意料地困难。'],
    'eveningstar "Brilliance"': ['eveningstar "Brilliance"', '堕落之后不久，伊莱德莱姆努尔试图把神圣能量扭曲成自身的黑暗仿制品，使其转而对抗其造物主，并削弱其对亡灵与恶魔的效果。但人们发现得太晚：如此彻底的扭曲无法控制；那邪恶火焰会使其注入的一切失稳或毁灭，只有几个恶魔实验体和一件被盗的神圣武器例外。一种更次等、也更稳定的黑暗能量被证明更为可行，并成为了伊莱德莱姆努尔的暗影。这就是那件武器：一把晨星锤，名不副实，其光芒早已逃逸，而它的阴影会排斥那些曾受其光芒抚慰之物……'],
    'sword of the Dread Knight': ['sword of the Dread Knight', '一把精金巨剑。它的第一位持用者是一位在战斗中拒绝使用魔法的伊莱德莱姆努尔信徒，更喜欢用蛮力摧毁敌人。不幸的是，并非所有对手都像她一样受限。在她手中，这把剑斩杀了无数强大的战士；那些被夺走生命的灵魂正召唤它在新的主人手中夺取更多生命。'],
    'amulet of Tranquillity': ['amulet of Tranquillity', '一枚纯净玉石制成的吊坠，赋予穿戴者强大的意志与精神韧性。'],
    'ghost crab claws': ['ghost crab claws', '一双巨大的幽灵蟹钳，被沼泽行者巫团制成手套，用于死灵仪式。无论是有魔法天赋者还是擅长拳斗者，都能借此与亡者之灵建立联系，但这些钳子让抓握其他任何东西都令人抓狂。（装备此物品时无法使用武器或盾牌。）'],
    'giant spiked club "Carina at Dusk"': ['giant spiked club "Carina at Dusk"', '就连巨魔也有自己的自然诗人、眼神迷离的梦想家和饥饿的艺术家。这件作品就是这样一个不安灵魂的杰作，一首献给高远苍穹的颂歌。'],
    'coolibah bardiche': ['coolibah bardiche', '一把用整棵酷栗树砍削而成的巨型长柄斧。木制刃口同样锋利，而被它附魔枝条缠住的人很快就会发现自己仿佛回到了这致命武器生长其中的沼泽。'],
    'staff of Five Virtues': ['staff of Five Virtues', '一位可敬武僧大师的法杖；她驱散敌人如同驱散执念，据说最终甚至超脱了生死。有资格的持用者或许能解锁法杖的巨大潜能，前提是遵循其前主人关于平衡与举止的独特理念。'],
    "Stagehand's Sword": ['Stagehand\'s Sword', '一把看似戏剧道具的普通长剑。但瞧！这里一拧、那里一按，真正的剑刃便弹射而出；寒光闪闪、凶险无比、杀气腾腾。它以前杀过生吗？如果有，也没留下目击者。它会为你杀人吗？只要你足够狡黠，它就会如你所愿。'],
    "Hana's Scimitar": ['Hana\'s Scimitar', '战法师亚拉最杰出弟子之一——据传是一位半神——最钟爱的弯刀。她常夸口说，一个法术加一记斩击就足以决定任何战斗。确实，她的所有决斗都以这种方式结束，包括最后一场。'],
    'arcane splint mail': ['arcane splint mail', '一套真正古老的护甲，为最大防护与灵活性而设计。显然是为骑乘的咒术枪手打造的；它的魔法结界与徽记已破败得无可救药，但其中仍残留着些许力量痕迹。'],
    'bone scales': ['bone scales', '骨龙半缝合（或半拆开）的躯干，被（如果这也能算的话）制成一件真正可悲的护甲。它参差的骨骼似乎脉动着不死之力，等待着某个邪恶主人的命令。'],
    "Forgewarden's cuirass": ['Forgewarden\'s cuirass', '一件工艺精湛的青铜胸甲，通体刻满宗教图像，但画面焦点被一大块深色污渍遮住了，那污渍散发着浓烈的灰烬与盐的气味。穿上它似乎有些亵渎。'],
  },
  ability: {
    'Pacify ability': ['安抚', '尝试安抚一个敌对生物，说服它放弃暴力。若成功，该生物会转为中立，并尽快离开本层。你将获得它的全部经验值。对神圣与活物效果最好；亡灵与恶魔越来越难以安抚——如果它们有智慧则尤其如此。无意识或无生命的生物无法被安抚，任何怪物在睡眠时也无法被安抚。祈神技能会提高成功率，并让你能安抚更强大的生物。'],
    'Divine Alms ability': ['神赐', '安抚一个受伤的友方生物，治疗其部分伤势（取决于你的祈神技能），并解除中毒、混乱、减速、疾病、虚弱、吸取与石化。任何被此能力治疗的召唤生物还可能获得少量额外存在时间。'],
    'Aura of Vigour ability': ['活力光环', '大幅提高你的最大生命与魔力（取决于祈神技能）。你当前的生命与魔力也会按比例提高。效果持续期间，附近任何友方生物的生命也会翻倍。'],
    'Ancestor Life: Elementalist ability': ['先祖人生：元素师', '将你的先祖记忆为元素师——一名强大但脆弱、能从安全距离释放毁灭法术的法师。此选择是永久的，无法撤销。'],
  },
  status: {
    'Stampede status': ['奔踏', '你正在奔踏冲锋。任何朝敌人的移动都会将其踩退，但只要你执行除暴走或奔踏之外的任何动作，冲锋就会结束。'],
    'Indom status': ['不屈', '你正在快速恢复生命（速率取决于最大生命），直到恢复指定数值。'],
    'Salvo status': ['齐射', '你接下来的数次远程攻击会向视野内其他目标额外齐射。'],
    'Tailwind status': ['顺风', '你的下一次“暴走”移动将是瞬间的。'],
    'Exegesis status': ['释经', '你刚使用过神谕阐释，可以大幅降低虔诚消耗重复同一法术。'],
    '-Jolt status': ['电击耗尽', '你刚释放过满功率电击，在完全恢复前无法再次使用。'],
    '-Sirocco status': ['热风耗尽', '你刚施放过热风，在连续数回合不移动前无法再次施放。'],
    'Vision status': ['视界', '你的第三只眼睁开，能看见施法残留的魔力并转化为有伤害的投射物。'],
    'Jade status': ['玉甲', '一团元素水晶笼罩你的上半身，提升你的元素魔法技能，并让你能将其以强大爆发释放出来。'],
    'Crystals status': ['水晶', '你身上的玉甲水晶数量。'],
    'Gecko status': ['壁虎', '你是催眠壁虎，一种能在受重伤时断尾作为诱饵的隐秘蜥蜴。'],
    '-Tail status': ['断尾', '你刚断尾，需要探索更多地牢才能重新长出。'],
    'Insubst status': ['虚体', '你的身体虚体化，免疫缠绕、石化、倒刺、黏性火焰、蛛网、捕网以及被流星锤缠住。'],
    'Vapour status': ['蒸汽', '刚喝下的药水化作气体在你体内翻涌。你的下一次近战攻击会根据所喝药水的类型喷出云雾。'],
    'Mistmane status': ['雾鬃', '你的头是一团翻涌的雾。你喝下的任何药水都会代谢成有害气体云雾，你可以用近战攻击将其喷出。'],
  },
  species: {
    'Gale Centaur': ['疾风半人马', '强壮的半人马混血种，自称血脉可追溯至四方之风本身；疾风半人马在向敌人疾驰冲锋时最为强大。'],
  },
  backgrounds: {
    'Mystic': ['秘法师', '秘法师用护符改造身体，以更契合魔法。他们的法术在战斗中需要机动性，但能汲取全部四种元素的力量。'],
    'Stalker': ['潜猎者', '潜猎者用护符改造身体，以更好地欺骗和削弱敌人。最终他们甚至能把药水转化为有害云雾的喷流。'],
  },
}

// Upstream prose that contains mako {{ … }} is resolved before it reaches the
// client, so the raw template key never matches. List the resolved variants
// here (whitespace is normalised the same way as the fetched descriptions).
const EXTRA_PAIRS = {
  'A small charm bearing the likeness of an eye. It gives the wearer supernatural sight, allowing them to perceive the clouds of magical residue left behind whenever beings cast spells. Touching those clouds allows them to convert that leftover magic into unnerring projectiles against nearby foes. This third eye even allows one to see from further distances than would otherwise be possible (but your own vision is already as long as possible).':
    '一枚眼睛形状的小护符。它赋予穿戴者超自然视力，使其能看见生物施法后残留的魔力云雾。触碰这些云雾，穿戴者就能把残留的魔力转化为射向附近敌人的必中投射物。这只第三只眼甚至能让穿戴者看得比原本更远（但你的视力本已达到最远）。',
  'A small charm bearing the likeness of an eye. It gives the wearer supernatural sight, allowing them to perceive the clouds of magical residue left behind whenever beings cast spells. Touching those clouds allows them to convert that leftover magic into unnerring projectiles against nearby foes. This third eye even allows one to see from further distances than would otherwise be possible, but be warned - creatures perceived this way will perceive you back.':
    '一枚眼睛形状的小护符。它赋予穿戴者超自然视力，使其能看见生物施法后残留的魔力云雾。触碰这些云雾，穿戴者就能把残留的魔力转化为射向附近敌人的必中投射物。这只第三只眼甚至能让穿戴者看得比原本更远，但要注意——被你这样看见的生物也能反过来看见你。',
  'A bronze chestpiece of masterful make. It is etched all over with religious imagery, but the focus of the scene is obscured by a great dark stain that smells strongly of ashes and salt. It seems somehow blasphemous to wear.':
    '一件工艺精湛的青铜胸甲，通体刻满宗教图像，但画面焦点被一大块深色污渍遮住了，那污渍散发着浓烈的灰烬与盐的气味。穿上它似乎有些亵渎。',
  'A bronze chestpiece of masterful make. It is etched all over with religious imagery, but the focus of the scene is obscured by a great dark stain of ashes and salt. It seems somehow blasphemous to wear.':
    '一件工艺精湛的青铜胸甲，通体刻满宗教图像，但画面焦点被一大块灰烬与盐形成的深色污渍遮住了。穿上它似乎有些亵渎。',
  'You are stampeding forward. Any movement you take into an enemy will trample them backwards, but your stampede will end as soon as you perform any action besides rampaging, stampeding, or casting spells.':
    '你正在奔踏冲锋。任何朝敌人的移动都会将其踩退，但只要你执行除暴走、奔踏或施法之外的任何动作，冲锋就会结束。',
  'You are stampeding forward. Any movement you take into an enemy will trample them backwards, but your stampede will end as soon as you perform any action besides rampaging or stampeding.':
    '你正在奔踏冲锋。任何朝敌人的移动都会将其踩退，但只要你执行除暴走或奔踏之外的任何动作，冲锋就会结束。',
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
    // Raw mako templates never reach the client (the engine resolves them
    // before sending), so they cannot be keys. Their resolved variants live in
    // EXTRA_PAIRS instead.
    if (!p.includes('{{')) pairs[p.replace(/\s+/g, ' ').trim()] = zhProse
  }
}
for (const [en, zh] of Object.entries(EXTRA_PAIRS)) {
  pairs[en.replace(/\s+/g, ' ').trim()] = zh
}
const out = `// Generated by tools/build-manual-zh.mjs — hand-written Chinese for content
// the 0.34.1 database lacks (DCSS 0.35 additions).
export const MANUAL_NAMES: Record<string, string> = ${JSON.stringify(names, null, 2)}

export const MANUAL_PROSE: Record<string, string> = ${JSON.stringify(pairs, null, 2)}
`
writeFileSync('src/i18n/manual-zh.ts', out)
console.log(`names=${Object.keys(names).length} pairs=${Object.keys(pairs).length} upstream-missing=${missing}`)
