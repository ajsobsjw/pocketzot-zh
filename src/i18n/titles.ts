// Dynamic titles that the engine composes with numbers or live state, so they
// have no dictionary key. Each rule is narrow on purpose: a wrong guess here
// would be visible on every menu.

export interface TitleRule {
  re: RegExp
  to: (m: RegExpExecArray) => string
}

const DAMAGE_WORDS: Record<string, string> = {
  acid: '酸', corrosion: '腐蚀', blinding: '致盲', miasma: '瘴气', drowning: '溺水',
  poison: '毒素', fire: '火', cold: '寒冷', electricity: '电', 'negative energy': '负能量',
  torment: '折磨', asphyxiation: '窒息', mutation: '变异', 'sticky flames': '黏性火焰',
}

const PRONOUN_ZH: Record<string, string> = { He: '他', She: '她', It: '它', They: '他们' }

/** "acid and corrosion and blinding" → 酸、腐蚀与致盲 */
function zhDamageList(list: string): string {
  const parts = list.split(/\s*,\s*|\s+and\s+/).map((p) => p.trim()).filter(Boolean)
  const zh = parts.map((p) => DAMAGE_WORDS[p.toLowerCase()] ?? p)
  if (zh.length <= 1) return zh.join('')
  return `${zh.slice(0, -1).join('、')}与${zh[zh.length - 1]}`
}

export const TITLE_RULES: TitleRule[] = [
  // "Gear: 1/52 gear slots    (Left/Right/Tab to switch category)"
  {
    re: /^Gear:\s*(\d+)\/(\d+) gear slots(.*)$/,
    to: (m) => `装备：${m[1]}/${m[2]}${m[3] ? `（左右/ Tab 切换类别）` : ''}`,
  },
  // t() translates the spell name through the dictionary before this fallback;
  // tTitle has no matcher, so it keeps the name and just formats the line.
  {
    re: /^(Casting|Aiming):\s*(.+?)\s*\((.+?);\s*(\d+)% risk of failure\)$/,
    to: (m) => {
      const q: Record<string, string> = {
        safe: '安全', 'mildly dangerous': '稍有危险', dangerous: '危险',
        'quite dangerous': '相当危险', 'extremely dangerous': '极度危险',
      }
      return `${m[1] === 'Casting' ? '施法' : '瞄准'}：${m[2]}（${q[m[3].toLowerCase()] ?? m[3]}；失败率 ${m[4]}%）`
    },
  },
  // "Where to? (? - help)"
  {
    re: /^Where to\?\s*\((?:Tab - ([^,]+),\s*)?\?\s*-\s*help\)$/,
    to: (m) => (m[1] ? `去哪里？（Tab - ${m[1]}，? - 帮助）` : '去哪里？（? - 帮助）'),
  },
  // "Really quit? [Y]es or [N]o"
  {
    re: /^Really quit\?\s*\[Y\]es or \[N\]o$/,
    to: () => '真的退出？（Y 是 / N 否）',
  },
  // "Spell assigned to a." / "Spell assigned to a"
  {
    re: /^Spell assigned to (\S+)\.?$/,
    to: (m) => `法术已分配到 ${m[1]}。`,
  },
  // "Memorise which spell?"
  {
    re: /^Memorise which spell\?$/,
    to: () => '记忆哪个法术？',
  },
  // "Adjust to which letter?  (? for menu, Esc to quit)"
  {
    re: /^Adjust to which letter\?\s*(.*)$/,
    to: (m) =>
      `调整到哪个字母？${m[1] ? '（? 呼出菜单，Esc 退出）' : ''}`,
  },
  // "Search for what [Enter for "death", or ? for help]?"
  {
    re: /^Search for what \[Enter for "(.*)", or \? for help\]\?$/,
    to: (m) => `搜索什么？[回车搜索“${m[1]}”，? 查看帮助]`,
  },
  // "Are you sure you want to abandon this character and quit the game?"
  {
    re: /^Are you sure you want to abandon this character and quit the game\?\s*(.*)$/,
    to: (m) => `确定要放弃这个角色并退出游戏吗？${m[1] ? '（输入 "quit" 确认。）' : ''}`,
  },
  // "Welcome back, Synthplayer the Gnoll Forgewright."
  {
    re: /^Welcome back, (.+)$/,
    to: (m) => `欢迎回来，${m[1]}`,
  },
  // "Welcome, <name>." / "Welcome, <name> the Deep Elf."
  {
    re: /^Welcome, (\S+) the (.+)$/,
    to: (m) => `欢迎，${m[1]}（${m[2]}）。`,
  },
  {
    re: /^Welcome, (\S+)\.$/,
    to: (m) => `欢迎，${m[1]}。`,
  },
  // "Hello, welcome to Dungeon Crawl Stone Soup 0.35-a0-1335-gb5a2e133e3!"
  {
    re: /^Hello, welcome to Dungeon Crawl Stone Soup (.+)!$/,
    to: (m) => `你好，欢迎来到《地牢探索：石头汤》${m[1]}！`,
  },
  // "Your skill: 0.0; use"
  {
    re: /^Your skill: (.+); use$/,
    to: (m) => `你的技能：${m[1]}；使用`,
  },
  // Monster-panel stat values.
  {
    re: /^Threat: (Trivial|Low|Medium|High)$/,
    to: (m) => `威胁：${{ Trivial: '微不足道', Low: '低', Medium: '中', High: '高' }[m[1]]}`,
  },
  {
    re: /^Size: (Small|Medium|Large|Big|Giant)$/,
    to: (m) => `体型：${{ Small: '小', Medium: '中', Large: '大', Big: '巨大', Giant: '巨型' }[m[1]]}`,
  },
  {
    re: /^Class: (Natural|Undead|Demon|Holy|Construct|Plant|Animal)$/,
    to: (m) =>
      `类别：${{ Natural: '自然', Undead: '亡灵', Demon: '恶魔', Holy: '神圣', Construct: '构装', Plant: '植物', Animal: '动物' }[m[1]]}`,
  },
  // "Downloading tiles 3/12…"
  {
    re: /^Downloading tiles (\d+)\/(\d+)…$/,
    to: (m) => `正在下载图块 ${m[1]}/${m[2]}…`,
  },
  // "Not installed · 22 MB" / "Installed · 08fc6789"
  { re: /^Not installed · (.+)$/, to: (m) => `未安装 · ${m[1]}` },
  { re: /^Installed · (.+)$/, to: (m) => `已安装 · ${m[1]}` },
  // "22 MB download" / "22 MB download left"
  { re: /^(.+) download left$/, to: (m) => `还需下载 ${m[1]}` },
  { re: /^(.+) download$/, to: (m) => `下载 ${m[1]}` },
  // "0 finished games" / "1 finished game"
  { re: /^(\d+) finished games?$/, to: (m) => `${m[1]} 局已结束` },
  // "Aim: an endoplasm (100% to hit)"
  { re: /^Aim: (.+)$/, to: (m) => `瞄准：${m[1]}` },
  // "Drop which item? (x - xyz)"
  {
    re: /^Drop which item\?\s*(.*)$/,
    to: (m) => `丢弃哪件物品？${m[1] ? ` ${m[1]}` : ''}`,
  },

  // --- spell menu prompts ---
  {
    re: /^Memorise (.+?), consuming (\d+) spell levels? and leaving (\d+)\?$/,
    to: (m) => `记忆${m[1]}，消耗 ${m[2]} 个法术等级，剩余 ${m[3]}？`,
  },
  {
    re: /^The spell is quite dangerous to miscast \((\d+)% risk of failure\)! Continue anyway\?$/,
    to: (m) => `这个法术失败风险很高（${m[1]}%）！仍要继续吗？`,
  },
  {
    re: /^Your icy armour will break if you move\. Continue\?$/,
    to: () => '移动会使你的冰甲破碎。要继续吗？',
  },
  { re: /^You miscast (.+)\.$/, to: (m) => `你施放${m[1]}失败了。` },

  // --- weapon / armour description panel ---
  {
    re: /^This weapon's minimum attack delay \((.+?)\) is reached at skill level (\d+)\.$/,
    to: (m) => `这把武器的最低攻击延迟（${m[1]}）在技能等级 ${m[2]} 时达到。`,
  },
  {
    // "At 100% training you would reach 7.0 in about 3.9 XLs."
    re: /^At (\d+)% training you would reach ([\d.]+) in (?:about|the equivalent of) ([\d.]+) XLs?\.$/,
    to: (m) => `按 ${m[1]}% 训练度，大约 ${m[3]} 个等级后可达到 ${m[2]}。`,
  },
  {
    // "At current training (45%) you would reach 7.0 in about 3.9 XLs."
    re: /^At current training \((\d+)%\) you would reach ([\d.]+) in (?:about|the equivalent of) ([\d.]+) XLs?\.$/,
    to: (m) => `按当前训练（${m[1]}%），大约 ${m[3]} 个等级后可达到 ${m[2]}。`,
  },
  {
    re: /^At a training level of (\d+)% you would reach ([\d.]+) in (?:about|the equivalent of) ([\d.]+) XLs?\.$/,
    to: (m) => `按 ${m[1]}% 训练度，大约 ${m[3]} 个等级后可达到 ${m[2]}。`,
  },
  {
    re: /^At current training you would reach ([\d.]+) in (?:about|the equivalent of) ([\d.]+) XLs?\.$/,
    to: (m) => `按当前训练，大约 ${m[2]} 个等级后可达到 ${m[1]}。`,
  },
  {
    re: /^Wearing a shield would reduce your attack speed with this weapon\.$/,
    to: () => '佩戴盾牌会降低这把武器的攻击速度。',
  },
  {
    re: /^Damage rating: (.+?) \(Base (.+?) x (.+?) \((Str|Dex)\) x (.+?) \(Skill\)(.*?)\)\.$/,
    to: (m) => `伤害评级：${m[1]}（基础 ${m[2]} × ${m[3]}（${m[4] === 'Str' ? '力量' : '敏捷'}）× ${m[5]}（技能）${m[6]}）。`,
  },
  {
    re: /^If you switch to wearing this armour:$/,
    to: () => '如果你改穿这件护甲：',
  },
  {
    re: /^Your AC would (increase by|decrease by|remain unchanged)(.*)$/,
    to: (m) => `你的护甲将${m[1] === 'increase by' ? '提高' : m[1] === 'decrease by' ? '降低' : '保持不变'}${m[2]}`,
  },
  {
    re: /^Your EV would (increase by|decrease by|remain unchanged)(.*)$/,
    to: (m) => `你的闪避将${m[1] === 'increase by' ? '提高' : m[1] === 'decrease by' ? '降低' : '保持不变'}${m[2]}`,
  },

  // --- monster panel prose ---
  { re: /^It can see invisible\.$/, to: () => '它能看见隐形。' },
  { re: /^It can travel through water\.$/, to: () => '它能在水中移动。' },
  { re: /^It can eat doors\.$/, to: () => '它能吃掉门。' },
  {
    re: /^It (?:has|have) a (\d+)% chance to notice you each turn\.$/,
    to: (m) => `它每回合有 ${m[1]}% 的概率注意到你。`,
  },
  { re: /^It has about (\d+)% to hit you\.$/, to: (m) => `它命中你的概率约为 ${m[1]}%。` },
  { re: /^It is amorphous and immune to ensnarement\.$/, to: () => '它是无定形的，免疫束缚。' },
  {
    re: /^Melee attacks you make against this creature will deal greatly increased damage, especially if made with a short blade\.$/,
    to: () => '你对这个生物发动的近战攻击会造成大幅提高的伤害，尤其是使用短刃时。',
  },
  { re: /^Killing this monster yields no experience or items\.$/, to: () => '击杀此怪物不会获得经验或物品。' },
  { re: /^This creature provides no experience or piety when slain\.$/, to: () => '击杀此生物不会提供经验或虔诚。' },
  { re: /^It possesses the following natural abilities:$/, to: () => '它具有以下天生能力：' },
  { re: /^This creature is being targeted by one or more of your allies\.$/, to: () => '这个生物正被你的一个或多个盟友锁定。' },

  // --- status ticks / misc ---
  { re: /^mildly poisoned \((.+?) -> (.+?)\)$/, to: (m) => `轻度中毒（${m[1]} → ${m[2]}）` },
  { re: /^quite poisoned \((.+?) -> (.+?)\)$/, to: (m) => `中度中毒（${m[1]} → ${m[2]}）` },
  { re: /^corroded \((.+?)\)$/, to: (m) => `被腐蚀（${m[1]}）` },
  { re: /^Corr \((.+?)\)$/, to: (m) => `腐蚀（${m[1]}）` },
  { re: /^Magic restored\.$/, to: () => '法力恢复了。' },
  { re: /^You feel a bit more experienced\.$/, to: () => '你感到经验有所增长。' },
  { re: /^You are held in a net!$/, to: () => '你被网住了！' },
  { re: /^You unwield your (.+)\.$/, to: (m) => `你收起了${m[1]}。` },
  { re: /^You open the large door\.$/, to: () => '你打开了大门。' },
  { re: /^You are splashed with acid!$/, to: () => '你被酸液溅到了！' },
  { re: /^Your hands burn!$/, to: () => '你的双手灼痛！' },
  { re: /^Your magical contamination has completely faded away\.$/, to: () => '你的魔法污染完全消退了。' },
  { re: /^You can't sustain more frozen ramparts right now\.$/, to: () => '你现在无法维持更多冰冻壁垒。' },
  { re: /^The (.+?) gazes fiercely through you!$/, to: (m) => `${m[1]}凶狠地凝视着你！` },
  { re: /^The (.+?) is no longer moving slowly\.$/, to: (m) => `${m[1]}不再缓慢移动。` },
  { re: /^(.+?) is destroyed!$/, to: (m) => `${m[1]}被摧毁了！` },

  // --- item property / effect lines ---
  {
    re: /^It affects your (strength|intelligence|dexterity) \((.+?)\)\.$/,
    to: (m) =>
      `它影响你的${{ strength: '力量', intelligence: '智力', dexterity: '敏捷' }[m[1]]}（${m[2]}）。`,
  },
  {
    re: /^Your spell failure would worsen by up to (\d+)% \(press '!' for details\)\.$/,
    to: (m) => `你的施法失败率最多会恶化 ${m[1]}%（按 '!' 查看详情）。`,
  },
  { re: /^You found it on level (.+) of the Dungeon\.$/, to: (m) => `你在地下城第 ${m[1]} 层找到了它。` },
  { re: /^You found it in (.+)\.$/, to: (m) => `你在${m[1]}找到了它。` },
  { re: /^It cannot be further enchanted\.$/, to: () => '它无法被进一步附魔。' },
  {
    re: /^This ancient artefact cannot be changed by magic or mundane means\.$/,
    to: () => '这件古老神器无法被魔法或凡俗手段改变。',
  },
  {
    re: /^It may be possible to recover its hide, which can be used as armour\.$/,
    to: () => '击杀它后可能可以剥取它的皮，用作护甲。',
  },
  { re: /^It can open doors\.$/, to: () => '它能打开门。' },
  {
    re: /^It has mastered the following spells, which are affected by silence and antimagic:$/,
    to: () => '它已掌握以下法术（受沉默与反魔法影响）：',
  },
  {
    re: /^It is immune to (.+?); and resistant to (.+?)\.$/,
    to: (m) => `它免疫${zhDamageList(m[1])}，并抗${zhDamageList(m[2])}。`,
  },
  { re: /^It is immune to (.+?)\.$/, to: (m) => `它免疫${zhDamageList(m[1])}。` },
  { re: /^It is resistant to (.+?)\.$/, to: (m) => `它抗${zhDamageList(m[1])}。` },
  {
    re: /^It inflicts (\d+d\d+) (.+?) damage when struck in melee\.$/,
    to: (m) => `近战被击中时会造成 ${m[1]} 点${zhDamageList(m[2])}伤害。`,
  },
  { re: /^Hit: (.+)$/, to: (m) => `命中：${m[1]}` },
  { re: /^It is currently targeted by (.+)\.$/, to: (m) => `它正被${m[1]}锁定。` },
  { re: /^Attack\s+Max Damage(?:\s+After Damaging Hits)?$/, to: () => '攻击    最大伤害    命中后效果' },
  { re: /^Attack\s+Max Damage\s+Range$/, to: () => '攻击    最大伤害    射程' },
  { re: /^Attacks\s+Max Damage$/, to: () => '攻击    最大伤害' },

  // --- gender-aware monster panel lines ---
  {
    re: /^(He|She|It|They) has about (\d+)% to hit you\.$/,
    to: (m) => `${PRONOUN_ZH[m[1]]}的命中率约为 ${m[2]}%。`,
  },
  {
    re: /^(He|She|It|They) (?:has|have) a (\d+)% chance to notice you each turn\.$/,
    to: (m) => `${PRONOUN_ZH[m[1]]}每回合有 ${m[2]}% 的概率注意到你。`,
  },
  { re: /^(He|She|It|They) can open doors\.$/, to: (m) => `${PRONOUN_ZH[m[1]]}能打开门。` },
  { re: /^(He|She|It|They) can see invisible\.$/, to: (m) => `${PRONOUN_ZH[m[1]]}能看见隐形。` },
  {
    re: /^(He|She|It|They) possesses the following (natural|magical|wand) (abilities|spells):$/,
    to: (m) => {
      const kind = m[2] === 'natural' ? '天生' : m[2] === 'magical' ? '魔法' : '魔杖'
      return `${PRONOUN_ZH[m[1]]}拥有以下${kind}${m[3] === 'spells' ? '法术' : '能力'}：`
    },
  },
  {
    re: /^(He|She|It|They) has mastered the following spells, which are affected by silence and antimagic:$/,
    to: (m) => `${PRONOUN_ZH[m[1]]}已掌握以下法术（受沉默与反魔法影响）：`,
  },
  {
    re: /^(He|She|It|They) is currently targeted by (.+)\.$/,
    to: (m) => `${PRONOUN_ZH[m[1]]}正被${m[2]}锁定。`,
  },
  { re: /^It is cold-blooded and may be slowed by cold attacks\.$/, to: () => '它是冷血动物，可能被寒冷攻击减速。' },
  { re: /^It is vulnerable to (.+) and hated by (.+)\.$/, to: (m) => `它惧怕${m[1]}，并被${m[2]}厌恶。` },
  { re: /^It is insubstantial and immune to ensnarement\.$/, to: () => '它是虚体的，免疫束缚。' },
  { re: /^It cannot move\.$/, to: () => '它无法移动。' },
  {
    re: /^Speed: (.+?) \((attack|travel|swim): (\d+)%\) \(normally travels (faster|slower) than you\)$/,
    to: (m) => `速度：${m[1]}（${m[2] === 'attack' ? '攻击' : m[2] === 'travel' ? '移动' : '游泳'}：${m[3]}%）（通常比你${m[4] === 'faster' ? '快' : '慢'}）`,
  },
  {
    re: /^速度：(.+?) \(normally travels (faster|slower) than you\)$/,
    to: (m) => `速度：${m[1]}（通常比你${m[2] === 'faster' ? '快' : '慢'}）`,
  },
  { re: /^Encumbrance rating: (\d+)$/, to: (m) => `负重等级：${m[1]}` },
  { re: /^If you removed this item, your spell failure would improve:$/, to: () => '如果你取下这件物品，你的施法失败率会改善：' },
  {
    re: /^Your spell failure would improve by up to (\d+)% \(press '!' for details\)\.$/,
    to: (m) => `你的施法失败率最多会改善 ${m[1]}%（按 '!' 查看详情）。`,
  },
  { re: /^Really fire in your ice beast's direction\?$/, to: () => '真的朝你的冰兽方向开火吗？' },
  { re: /^Really attack while wielding nothing\?$/, to: () => '真的要在空手时攻击吗？' },
  { re: /^Generating dungeon\.\.\.$/, to: () => '正在生成地牢……' },
  { re: /^Welcome to the (.+)!$/, to: (m) => `欢迎来到${m[1]}！` },
  {
    re: /^What level of the (.+)\? \(default (\d+)\)$/,
    to: (m) => `要去${m[1]}第几层？（默认 ${m[2]}）`,
  },
  { re: /^Unbind and destroy which item\?$/, to: () => '解除并摧毁哪件物品？' },

  // --- spell description page ---
  {
    re: /^Level: (\d+)\s+School: (.+?)\s+Fail: (\d+)%$/,
    to: (m) => {
      const schools: Record<string, string> = {
        Conjuration: '咒法系', Summoning: '召唤系', Necromancy: '死灵法术',
        Transmutation: '变形术', Fire: '火系', Ice: '冰系', Air: '气系',
        Earth: '土系', Poison: '毒系', Hexes: '诅咒系', Charms: '魅惑系',
      }
      return `等级：${m[1]}  学派：${schools[m[2]] ?? m[2]}  失败率：${m[3]}%`
    },
  },
  { re: /^Power: (\d+)%$/, to: (m) => `威力：${m[1]}%` },
  { re: /^Range: (.+)$/, to: (m) => `射程：${m[1] === 'N/A' ? '无' : m[1]}` },
  { re: /^Noise: (.+)$/, to: (m) => `噪音：${m[1]}` },
  {
    re: /^Miscasting this spell causes magic contamination and also summons a nameless horror\.$/,
    to: () => '施放此法术失误会造成魔法污染，并召唤出无名恐怖。',
  },
  {
    re: /^Miscasting this spell causes magic contamination\.$/,
    to: () => '施放此法术失误会造成魔法污染。',
  },
  {
    re: /^With your current stats and equipment, training (.+?) to ([\d.]+) would reduce your failure rate to (\d+)%\. This would take about ([\d.]+) XLs?\.?$/,
    to: (m) => `以你当前的属性和装备，把${m[1]}训练到 ${m[2]} 可将失败率降到 ${m[3]}%。这大约需要 ${m[4]} 个等级。`,
  },
  {
    re: /^You can sustain at most (.+?) creatures? summoned by this spell\.$/,
    to: (m) => `你最多只能维持 ${m[1]} 个由此法术召唤的生物。`,
  },
  // "Ice/Summoning" — the school pair printed above a spell list.
  {
    re: /^It protects you from (.+)\.$/,
    to: (m) => `它保护你免受${zhDamageList(m[1])}伤害。`,
  },
  {
    re: /^It increases the power of your (.+) spells\.$/,
    to: (m) => {
      const schools: Record<string, string> = {
        Ice: '冰系', Fire: '火系', Air: '气系', Earth: '土系', Poison: '毒系',
        Conjuration: '咒法系', Summoning: '召唤系', Necromancy: '死灵法术',
        Transmutation: '变形术', Hexes: '诅咒系',
      }
      return `它增强你${schools[m[1]] ?? m[1]}法术的威力。`
    },
  },
  {
    re: /^At your current (.+) skills, it has a (\d+)% chance to deal up to (\d+) additional (.+) damage\.$/,
    to: (m) => `以你当前的${m[1]}技能，它有 ${m[2]}% 几率造成最多 ${m[3]} 点额外${m[4]}伤害。`,
  },
  {
    re: /^It falls into the [‘'"](.+?)[’'"] category\.$/,
    to: (m) => {
      const cats: Record<string, string> = {
        Staves: '法杖', Weapons: '武器', Armour: '护甲', Jewellery: '首饰', Books: '书',
      }
      return `它属于“${cats[m[1]] ?? m[1]}”类别。`
    },
  },
  { re: /^If you take off this armour:$/, to: () => '如果你脱下这件护甲：' },
  { re: /^If you unwield this staff:$/, to: () => '如果你收起这根法杖：' },
  { re: /^If you remove this ring:$/, to: () => '如果你取下这枚戒指：' },
  { re: /^If you remove this item:$/, to: () => '如果你取下这件物品：' },
  {
    re: /^You found it on level (.+) of the (.+)\.$/,
    to: (m) => `你在${m[2]}第 ${m[1]} 层找到了它。`,
  },
  { re: /^It is a one-handed weapon\.$/, to: () => '它是一把单手武器。' },
  { re: /^It is a two-handed weapon\.$/, to: () => '它是一把双手武器。' },
  { re: /^It increases your willpower\.$/, to: () => '它提升你的意志。' },
  { re: /^It is very cumbersome, slowing your movement\.$/, to: () => '它非常笨重，会拖慢你的移动。' },
  {
    re: /^It affects your magic capacity \(([+-]\d+)\)\.$/,
    to: (m) => `它影响你的法力（${m[1]}）。`,
  },
  {
    re: /^It enhances your (.+) magic\.$/,
    to: (m) => {
      const s: Record<string, string> = {
        Earth: '大地', Fire: '火焰', Ice: '寒冰', Air: '空气', Poison: '毒素',
        Conjuration: '咒法', Summoning: '召唤', Necromancy: '死灵', Transmutation: '变形',
      }
      return `它增强你的${s[m[1]] ?? m[1]}魔法。`
    },
  },
  {
    re: /^You took it off (.+) on level (\d+) of the (.+)\.$/,
    to: (m) => `你从${m[3]}第 ${m[2]} 层的${m[1]}身上取下了它。`,
  },
  {
    re: /^Your attack delay would (increase|decrease) by ([\d.]+) \(([\d.]+) -> ([\d.]+)\)\.$/,
    to: (m) => `你的攻击延迟会${m[1] === 'increase' ? '增加' : '减少'} ${m[2]}（${m[3]} → ${m[4]}）。`,
  },
  {
    re: /^Base hit: ([+-]?\d+)\s+Base damage: (\d+)\s+Base attack delay: ([\d.]+)$/,
    to: (m) => `基础命中：${m[1]}  基础伤害：${m[2]}  基础攻击延迟：${m[3]}`,
  },  {
    re: /^(Conjuration|Summoning|Necromancy|Transmutation|Fire|Ice|Air|Earth|Poison|Hexes)\/(Conjuration|Summoning|Necromancy|Transmutation|Fire|Ice|Air|Earth|Poison|Hexes)$/,
    to: (m) => {
      const s: Record<string, string> = {
        Conjuration: '咒法系', Summoning: '召唤系', Necromancy: '死灵法术',
        Transmutation: '变形术', Fire: '火系', Ice: '冰系', Air: '气系',
        Earth: '土系', Poison: '毒系', Hexes: '诅咒系',
      }
      return `${s[m[1]]}／${s[m[2]]}`
    },
  },
]

export function matchTitle(text: string): string | null {
  for (const r of TITLE_RULES) {
    const m = r.re.exec(text)
    if (m) return r.to(m)
  }
  return null
}
