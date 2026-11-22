// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setLang, tItem, tMore, tTitle } from './index'
import { loadDescript } from './describe'
import { translateOverviewMarkup, translatePage } from './pages'
import { translateCharOverview } from './char-overview'
import { displayMessageLine, translateMessageHistory } from './messages'
import { translateStatusLight, translateMonsterPanelStatus } from './status'
import { LayoutView } from '../views/layout-view'
import { CELL_SEP, GRID_MARK, renderSpellbook } from '../views/overlay-body'
import { localizeSkillRows } from '../views/skill-reflow'
import { zhCost } from '../views/menu-columns'
import { CrtView } from '../views/crt-view'
import { StatusView } from '../game/hud/status-view'
import { StatsView } from '../game/hud/stats-view'
import { InventoryStore } from '../game/inventory-store'
import { MonsterPanelView } from '../game/hud/monster-panel'
import { MapStore } from '../game/map/map-store'
import { showNewgameChoice } from '../views/newgame-view'
import { showInputDialog, showSeedSelection, type OverlayScreenCtx, type UiPushMsg } from '../views/game-overlays'
import { reflowOverview } from '../views/overview-reflow'
import type { ClientMsg } from '../ws/types'

beforeEach(async () => {
  await setLang('zh')
  await loadDescript()
})

afterEach(async () => {
  await setLang('en')
})

describe('localization audit fixes: titles, acquirement, stash, and footer keyhelp', () => {
  it('translates newgame welcome and random-combo titles', () => {
    expect(tTitle('Welcome, crawler. Please select your species.')).toBe('欢迎，crawler。请选择你的种族。')
    expect(tTitle('Welcome, crawler the Minotaur. Please select your background.')).toBe('欢迎，crawler（牛头人）。请选择你的职业。')
    expect(tTitle('Welcome, crawler the Minotaur Berserker.')).toBe('欢迎，crawler（牛头人狂战士）。')
    expect(tTitle('You are a Naga Reaver.')).toBe('你是一名娜迦掠夺者。')
  })

  it('translates StashSearchMenu titles in both travel/view and dist/type modes', () => {
    expect(tTitle('12 matches: travel [toggle: !], by dist [/], hide useless & duplicates [=]'))
      .toBe('12 个匹配：前往［! 切换］，按距离［/］，隐藏无用与重复物品［=］')
    expect(tTitle('1 match: view   [toggle: !], by type [/], show useless & duplicates [=]'))
      .toBe('1 个匹配：查看［! 切换］，按类型［/］，显示无用与重复物品［=］')
  })

  it('translates AcquireMenu titles, gold rows, and confirmation keyhelp', () => {
    expect(tTitle('Choose a gizmo to assemble.')).toBe('选择要组装的小装置。')
    expect(tTitle('Choose an item to acquire.')).toBe('选择要获取的物品。')
    expect(tItem('a - 500 gold pieces (you have 123 gold)')).toBe('a - 500 枚金币（你现有 123 金币）')
    expect(tMore('Acquire +2 dagger? (y/N)')).toBe('获取+2匕首？（y/N）')
    expect(tMore('[a-e] select gizmo to assemble | [!] examine gizmo')).toBe('[a-e] 选择要组装的小装置 | [!] 查看小装置')
    expect(tMore('[a-e] select item for acquirement | [!] examine items')).toBe('[a-e] 选择要获取的物品 | [!] 查看物品')
    expect(tMore('<lightgrey>Hit any key to exit</lightgrey>')).toBe('<lightgrey>按任意键退出</lightgrey>')
  })
})

describe('localization audit fixes: menu-columns ability costs', () => {
  it('translates extended 0.35 ability costs without dropping rows to English', () => {
    expect(zhCost('3 MP, Piety--')).toBe('3 法力，虔诚--')
    expect(zhCost('Permanent MP (2 left)')).toBe('永久法力（剩 2）')
    expect(zhCost('5 MP, Noise, Delay')).toBe('5 法力，噪音，延迟')
    expect(zhCost('Breath')).toBe('吐息')
    expect(zhCost('2/3 uses available')).toBe('可用 2/3 次')
    expect(zhCost('150 Gold')).toBe('150 金币')
    expect(zhCost('Cursed item, Instant')).toBe('诅咒物品，瞬发')
    expect(zhCost('A Card (4 left)')).toBe('一张卡牌（剩 4）')
    expect(zhCost('Torchlight')).toBe('火把光亮')
    expect(zhCost('Free')).toBe('免费')
  })
})

describe('localization audit fixes: skill screen & CRT language switch', () => {
  it('translates alternate skill headers, toggles, and great experience prompt', () => {
    const out = localizeSkillRows([
      '<span class="fg15">You have gained great experience. Select the skills to train.</span>',
      '     Skill     Level Target Progr Points Cost  > New Apt',
      '<span>[/]</span> <span>train</span>|<span>focus</span> <span>enhanced</span>|<span>base</span> <span>progress</span>|<span>points</span>|<span>new level</span>',
    ])
    expect(out[0]).toContain('你获得了大量经验。请选择要训练的技能。')
    expect(out[1]).toContain('技能')
    expect(out[1]).toContain('等级')
    expect(out[1]).toContain('目标')
    expect(out[1]).toContain('进度')
    expect(out[1]).toContain('点数')
    expect(out[1]).toContain('消耗')
    expect(out[1]).toContain('新')
    expect(out[1]).toContain('资质')
    expect(out[2]).toContain('训练')
    expect(out[2]).toContain('专注')
    expect(out[2]).toContain('强化')
    expect(out[2]).toContain('基础')
    expect(out[2]).toContain('进度')
    expect(out[2]).toContain('点数')
    expect(out[2]).toContain('新等级')
  })

  it('repaints CrtView when language switches and stops after dispose', async () => {
    const content = document.createElement('div')
    const frame: { tag?: string; lines: Map<number, string> } = { tag: 'skills', lines: new Map() }
    const crt = new CrtView({
      content: () => content,
      enterLayout: () => { content.textContent = '' },
      bar: { build: () => {}, setSkillLetters: () => {} } as never,
      showBar: () => {},
      topCrt: () => frame,
      closeAutoKbd: () => {},
      focusView: () => {},
    })
    crt.open('skills')
    crt.updateLines({ 0: 'You have gained great experience. Select the skills to train.' }, true)
    expect(content.textContent).toContain('你获得了大量经验。请选择要训练的技能。')
    await setLang('en')
    expect(content.textContent).toContain('You have gained great experience.')
    crt.dispose()
    await setLang('zh')
    // Disposed view must not repaint on later language changes.
    expect(content.textContent).toContain('You have gained great experience.')
  })
})

describe('localization audit fixes: layout-view, overview reflow, and spellbook', () => {
  it('translates actionsBar labels while sending original hotkeys, and translates scroller more footer', async () => {
    const root = document.createElement('div')
    const sent: ClientMsg[] = []
    let top: UiPushMsg | undefined
    const lv = new LayoutView({
      content: () => root,
      renderOverlay: (title, build) => {
        root.textContent = ''
        const h = document.createElement('div')
        h.className = 'overlay-title'
        h.textContent = tTitle(title)
        root.appendChild(h)
        build()
      },
      send: (m) => sent.push(m),
      focusView: () => {},
      guardedFocus: () => {},
      loader: () => null,
      spectating: false,
      topLayout: () => top,
      visible: () => true,
      repaint: () => {},
      showTextPage: () => {},
    })

    top = {
      type: 'describe-item',
      title: 'a - a +0 dagger',
      body: 'A small blade.',
      actions: 'You can (w)ield, (q)uiver, e(v)oke, (d)rop, (i)nscribe, or (=)adjust.',
    }
    lv.show(top)
    const btns = Array.from(root.querySelectorAll<HTMLButtonElement>('.action-btn'))
    expect(btns.map(b => b.textContent)).toEqual([
      '你可以(w) 持握', '(q) 放入箭袋', '(v) 激发', '(d) 丢弃', '(i) 刻写', '(=) 调整字母',
    ])
    btns[2].click()
    btns[5].click()
    expect(sent).toEqual([{ msg: 'input', text: 'v' }, { msg: 'input', text: '=' }])

    top = {
      type: 'formatted-scroller',
      title: 'Error',
      text: 'Something happened.',
      more: 'Hit any key to exit',
    }
    lv.show(top)
    expect(root.querySelector('.scroller-more')?.textContent).toBe('按任意键退出')
    lv.dispose()
  })

  it('preserves reflowed Ctrl-O overview grids while localizing headers and branch names', () => {
    const raw = [
      '                    <white>Dungeon Overview and Level Annotations</white>',
      '',
      '<green>Branches:</green> (press <white>G</white> to reach them and <white>?/b</white> for more information)',
      '<yellow>Dungeon<lightgrey> <darkgrey>(1/15)<lightgrey>           <yellow>Temple<lightgrey> <darkgrey>(1/1)<lightgrey>           ',
      '<darkgrey>Lair<lightgrey>                <darkgrey>Orc<lightgrey>                 ',
      '',
      '<green>Altars:</green> (press <white>Ctrl-F</white> "altar" to reach them and <white>?/g</white> for more information)',
      '<darkgrey>Ashenzari<lightgrey>          <darkgrey>Okawaru<lightgrey>            ',
    ].join('\n')

    const reflowed = reflowOverview(raw)
    const localized = translateOverviewMarkup(reflowed)
    expect(localized).toContain('地牢总览与层级标注')
    expect(localized).toContain('分支：')
    expect(localized).toContain('祭坛：')
    expect(localized).toContain('地牢')
    expect(localized).toContain('神殿')
    expect(localized).toContain('兽巢')
    expect(localized).toContain('兽人矿坑')
    // Must keep colour tags & layout markers intact for renderBodyLines
    expect(localized).toContain('<yellow>')
    expect(localized).toContain(`${GRID_MARK}grid${CELL_SEP}`)
  })

  it('localizes renderSpellbook header, spell names with Dithmenos markers, and spell effects', () => {
    const el = renderSpellbook(null, {
      label: '\nIt has mastered the following spells (vulnerable to silence):',
      spells: [
        { letter: 'a', title: '<magenta>!</magenta> Throw Flame', tile: 1, effect: '3d8', range_string: '5' },
        { letter: 'b', title: 'Blink', tile: 2, effect: '(immune)' },
        { letter: 'c', title: 'Dispel Undead', tile: 3, effect: '0-5 MP' },
      ],
    }, false, vi.fn())
    expect(el.querySelector('.overlay-line')?.textContent).toBe('它掌握了以下法术（受沉默影响）：')
    const names = Array.from(el.querySelectorAll('.overlay-spell-name')).map(n => n.textContent)
    expect(names[0]).toContain('!')
    expect(names[0]).not.toContain('Throw Flame')
    expect(names[1]).not.toContain('Blink')
    const effects = Array.from(el.querySelectorAll('.overlay-spell-effect')).map(n => n.textContent)
    expect(effects).toEqual(['3d8', '（免疫）', '0-5 法力'])
  })
})

describe('localization audit fixes: HUD status pills, monster panel, and newgame/seed overlays', () => {
  it('localizes short HUD status pills and repaints on language switch', async () => {
    expect(translateStatusLight('Fast')).toBe('加速')
    expect(translateStatusLight('Corr (-4)')).toBe('腐蚀 (-4)')
    expect(translateStatusLight('Slay +3')).toBe('杀戮 +3')
    expect(translateMonsterPanelStatus('poisoned')).toBe('中毒')
    expect(translateMonsterPanelStatus('2 memories left')).toBe('剩余 2 点记忆')

    const sv = new StatusView()
    sv.update([
      { light: 'Fast', text: 'hasted', col: 10 },
      { light: '<white>Zot</white> (123)', use_html: true, col: 15 },
    ])
    expect(sv.element.textContent).toContain('加速')
    expect(sv.element.textContent).toContain('佐特 (123)')
    await setLang('en')
    expect(sv.element.textContent).toContain('Fast')
    expect(sv.element.textContent).toContain('Zot (123)')
    sv.dispose()
  })

  it('localizes MonsterPanelView names/statuses and repaints on language switch', async () => {
    const store = new MapStore()
    const mp = new MonsterPanelView(store)
    mp.update(new Map([
      ['1,1', {
        x: 1, y: 1, g: 'g',
        mon: { id: 1, name: 'goblin', att: 3, typedata: {} },
      }],
    ]))
    expect(mp.element.textContent).toContain('地精')
    expect(mp.element.textContent).toContain('（和平）')
    await setLang('en')
    expect(mp.element.textContent).toContain('goblin')
    expect(mp.element.textContent).toContain('(peaceful)')
    mp.dispose()
  })

  it('localizes newgame-choice, input-dialog, and seed-selection overlays', () => {
    const overlay = document.createElement('div')
    const ctx: OverlayScreenCtx = {
      overlay,
      send: () => {},
      enterLayout: () => { overlay.textContent = '' },
      enterPopup: () => { overlay.textContent = ''; return overlay },
      renderOverlay: (title, build) => {
        overlay.textContent = ''
        const h = document.createElement('div')
        h.textContent = tTitle(title)
        overlay.appendChild(h)
        build()
      },
      autoOpenKbd: () => {},
      focusView: () => {},
      getLoader: () => null,
      isSpectating: () => false,
    }

    showNewgameChoice(ctx, {
      type: 'newgame-choice',
      title: '<brown>Welcome, crawler.<yellow> Please select your species.',
      'main-items': {
        menu_id: 'species-main',
        width: 1,
        height: 2,
        labels: [{ x: 0, y: 0, label: '<lightblue>Simple' }],
        buttons: [{ x: 0, y: 1, hotkey: 97, label: '<white>a - Minotaur' }],
      },
      'sub-items': {
        menu_id: 'species-sub',
        width: 1,
        height: 1,
        buttons: [{ x: 0, y: 0, hotkey: 42, label: '<brown>* - Random species' }],
      },
    })
    expect(overlay.textContent).toContain('欢迎，crawler。')
    expect(overlay.textContent).toContain('请选择你的种族。')
    expect(overlay.textContent).toContain('入门')
    expect(overlay.textContent).toContain('牛头人')
    expect(overlay.textContent).toContain('* - 随机种族')

    showInputDialog(ctx, { type: 'msgwin-get-line', prompt: 'Describe what?' })
    expect(overlay.querySelector('.input-dialog-prompt')?.textContent).not.toBe('Describe what?')

    showSeedSelection(ctx, {
      type: 'seed-selection',
      title: 'Select a game seed',
      body: 'Choose a custom seed for your game.',
    })
    expect(overlay.querySelector('.seed-header')?.textContent).toBe('选择游戏种子')
  })

  it('localizes StatsView HUD captions natively and updates AC/Str live across language switches', async () => {
    const sv = new StatsView(new InventoryStore())
    sv.update({
      name: 'Shshssjdj',
      title: 'the Cleaver',
      species: 'Minotaur',
      god: 'Okawaru',
      ac: 12,
      ev: 8,
      sh: 4,
      str: 23,
      int: 5,
      dex: 10,
    })
    expect(sv.element.querySelector('#hud-ac')?.textContent).toBe('12')
    expect(sv.element.textContent).toContain('防')
    expect(sv.element.textContent).toContain('力')
    expect(sv.element.textContent).toContain('Shshssjdj 劈裂者')

    sv.update({ ac: 13, str: 25 })
    expect(sv.element.querySelector('#hud-ac')?.textContent).toBe('13')
    expect(sv.element.querySelector('#hud-str')?.textContent).toBe('25')
    sv.update({ title: ' the Severer' })
    expect(sv.element.textContent).toContain('Shshssjdj 断骨者')

    await setLang('en')
    expect(sv.element.querySelector('#hud-ac')?.textContent).toBe('13')
    expect(sv.element.textContent).toContain('AC')
    expect(sv.element.textContent).toContain('Shshssjdj the Severer')
    sv.dispose()
  })

  it('localizes the Amaemon encounter in live messages and history without changing wire text', async () => {
    const raw = '<red>You encounter Amaemon the Diabolical Poisoner and\nan orange demon. Amaemon is wielding the +8 whip "Snakebite" {venom, curare, rPois}.'
    const cry = 'The orange demon screeches!'
    const zh = '<red>你遭遇了邪毒师亚麦蒙、橙色恶魔。亚麦蒙手持+8鞭子「蛇咬」 {淬毒, 箭毒, 毒抗}。'
    expect(displayMessageLine(raw)).toBe(zh)
    expect(displayMessageLine(cry)).toBe('橙色恶魔发出一声尖啸！')
    expect(translateMessageHistory(`_${raw.replace('\n', ' ')}\n ${cry}`)).toBe(`_${zh}\n 橙色恶魔发出一声尖啸！`)
    expect(tItem('a scroll labelled VENOM CURARE')).toContain('VENOM CURARE')
    await setLang('en')
    expect(displayMessageLine(raw)).toBe(raw)
    expect(displayMessageLine(cry)).toBe(cry)
  })

  it('fully localizes the % character overview screen while preserving DCSS colour tags', async () => {
    const raw = [
      '<yellow>Shshssjdj the Cleaver (Minotaur Fighter)       Turns: 7301, Time: 00:39:42</yellow>',
      '<brown>Health: <lightgrey>78/78      <brown>AC: <lightgrey>13    <brown>Str: <lightgrey>25    <brown>XL:     <lightgrey>9<brown>   Next: <lightgrey>55%',
      '<brown>Magic:  <lightgrey>8/8        <brown>EV: <lightgrey> 8    <brown>Int: <lightgrey> 5    <brown>God:    <lightgrey><cyan>Okawaru [***...]</cyan>',
      '<brown>Gold:   <lightgrey>290        <brown>SH: <lightgrey> 4    <brown>Dex: <lightgrey>10    <brown>Spells: <lightgrey>0/8 levels left',
      '',
      '<darkgrey>rFire   . . .      (100%) <w>a</w> - <lightgrey>+0 war axe</lightgrey>',
      '<darkgrey>rCold   . . .      (100%) <w>b</w> - <lightgrey>+0 chain mail</lightgrey>',
      '<darkgrey>rNeg    . . .      (100%) <w>c</w> - <lightgrey>+0 kite shield</lightgrey>',
      '<green>rPois   +          (33%)  <darkgrey>(no helmet)</darkgrey>',
      '<darkgrey>rElec   .          (100%) <darkgrey>(no cloak)</darkgrey>',
      '<darkgrey>rCorr   .          (100%) <w>l</w> - <lightgrey>pair of gloves</lightgrey>',
      '<lightgrey>SInv    +                 <darkgrey>(no boots)</darkgrey>',
      '<lightgrey>Will    +....             <darkgrey>(no amulet)</darkgrey>',
      '<darkgrey>Stlth   ..........        <darkgrey>(no ring)</darkgrey>',
      'HPRegen 0.33/turn         <darkgrey>(no ring)</darkgrey>',
      'MPRegen 0.11/turn',
      '',
      '<w>%:</w> no passive effects',
      '<w>@:</w> no status effects',
      '<w>A:</w> Horns 2, retaliatory headbutt',
    ].join('\n')

    const overlay = document.createElement('div')
    let top: UiPushMsg | undefined
    const lv = new LayoutView({
      content: () => overlay,
      renderOverlay: (_title, build) => { overlay.innerHTML = ''; build() },
      send: () => {},
      focusView: () => {},
      guardedFocus: () => {},
      loader: () => null,
      topLayout: () => top,
      spectating: false,
      repaint: () => {},
      showTextPage: () => {},
      visible: () => true,
    })
    top = { type: 'formatted-scroller', tag: 'resists', text: raw }
    try {
      lv.show(top)

      const text = overlay.textContent ?? ''
      expect(text).toContain('Shshssjdj 劈裂者（牛头人战士）')
      expect(text).toContain('回合: 7301，时间: 00:39:42')
      expect(text).toContain('生命:   78/78')
      expect(text).toContain('防御: 13')
      expect(text).toContain('力量: 25')
      expect(text).toContain('等级:   9')
      expect(text).toContain('下级: 55%')
      expect(text).toContain('法力:   8/8')
      expect(text).toContain('闪避:  8')
      expect(text).toContain('智力:  5')
      expect(text).toContain('信仰:   奥卡瓦鲁 [***...]')
      expect(text).toContain('金币:   290')
      expect(text).toContain('格挡:  4')
      expect(text).toContain('敏捷: 10')
      expect(text).toContain('法术:   剩余 0/8 级')
      expect(text).toContain('火抗')
      expect(text).toContain('冰抗')
      expect(text).toContain('负能')
      expect(text).toContain('毒抗')
      expect(text).toContain('电抗')
      expect(text).toContain('酸抗')
      expect(text).toContain('看破隐形')
      expect(text).toContain('意志')
      expect(text).toContain('潜行')
      expect(text).toContain('回血    0.33/回合')
      expect(text).toContain('回魔    0.11/回合')
      expect(text).toContain('战斧')
      expect(text).toContain('锁子甲')
      expect(text).toContain('鸢盾')
      expect(text).toContain('手套')
      expect(text).toContain('(无头盔)')
      expect(text).toContain('(无斗篷)')
      expect(text).toContain('(无靴子)')
      expect(text).toContain('(无护身符)')
      expect(text).toContain('(无戒指)')
      expect(text).toContain('%: 无被动效果')
      expect(text).toContain('@: 无状态效果')
      expect(text).toContain('A: 角顶 2，报复性头槌')
      expect(text).not.toContain('一阵')
      // No stray English words left except the player name and single-letter hotkeys.
      const leftover = text.replace(/Shshssjdj/g, '').match(/[A-Za-z]{2,}/g) ?? []
      expect(leftover).toEqual([])
      // Verify that each translated phrase retains its original DCSS colour.
      const spans = Array.from(overlay.querySelectorAll('span[style]'))
      expect(spans.find(s => s.textContent?.includes('劈裂者'))?.getAttribute('style')).toContain('#fce94f')
      expect(spans.find(s => s.textContent?.includes('毒抗'))?.getAttribute('style')).toContain('#4e9a06')
      expect(spans.find(s => s.textContent?.includes('无头盔'))?.getAttribute('style')).toContain('#555753')
      expect(overlay.querySelector<HTMLElement>('.overlay-body')?.dataset.noI18n).toBe('')

      // Switching back to English restores the original English overview.
      await setLang('en')
      expect(overlay.textContent).toContain('Shshssjdj the Cleaver (Minotaur Fighter)')
      expect(overlay.textContent).toContain('Horns 2, retaliatory headbutt')
    } finally {
      lv.dispose()
    }
  })

  it('handles % overview edge cases: abbreviated combo, vulnerability, melded/unarmed, passives, wrapped mutations, orb and runes', () => {
    const raw = [
      '<yellow>Hero the Pugilist (MiFi)       Turns: 999, Time: 00:10:00</yellow>',
      '<brown>Magic:  <lightgrey>8/8        <brown>EV: <lightgrey> 8    <brown>Int: <lightgrey> 5    <brown>God:    <lightgrey><yellow>the Shining One [****..]</yellow>',
      '                                         <brown>Lives:  <lightgrey>2<brown>   Deaths: <lightgrey>1',
      '<red>rFire   x . .  <lightgrey>(150%)<red> <w>a</w> - <darkgrey>melded +2 chain mail</darkgrey>',
      '<green>rPois   ∞          (0%)     - unarmed',
      '<darkgrey>rElec   .          (100%) <darkgrey>(helmet unavailable)</darkgrey>',
      '<darkgrey>rCorr   .          (100%)   <darkgrey>[ring occupied]</darkgrey>',
      '<lightgrey>Stlth                  <w>z</w> - <yellow>scroll labelled VENOM CURARE</yellow>',
      '<w>%:</w> reflection, harm (+30% outgoing, +20% incoming), wizardry (x1),',
      'infuse magic (1 MP), rampage+∞',
      '<w>@:</w> quick, seriously poisoned, berserking (expiring), corroded (-4), constricted (roots)',
      '<w>A:</w> <darkgrey>(Horns 2)</darkgrey>, [spit poison],',
      'tough skin 1[+1]',
      '<w>0:</w> Orb of Zot',
      '<w>}:</w> 2/15 runes: slimy, golden',
    ].join('\n')
    const out = translateCharOverview(raw)
    expect(out).toContain('Hero 拳手（牛头人战士）')
    expect(out).toContain('光辉者 [****..]')
    expect(out).toContain('<brown>生命数: <lightgrey>2<brown>   死亡数: <lightgrey>1')
    expect(out).toContain('火抗    x . .  <lightgrey>(150%)<red> <w>a</w>')
    expect(out).toContain('（已融合）')
    expect(out).toContain('毒抗    ∞          (0%)')
    expect(out).toContain('  - 空手')
    expect(out).toContain('(头盔不可用)')
    expect(out).toContain('[戒指槽已占用]')
    expect(out).toContain('<w>z</w> - <yellow>卷轴（标签 VENOM CURARE）</yellow>')
    expect(out).toContain('反射，伤害加深（造成+30%，承受+20%），巫术（x1），注入魔力（1 法力），冲锋+∞')
    expect(out).toContain('急促，严重中毒，狂暴中（即将结束），腐蚀（-4），被根须缠住')
    expect(out).toContain('<darkgrey>(角顶 2)</darkgrey>，[吐毒]，')
    expect(out).toContain('1[+1]')
    expect(out).toContain('<w>0:</w> 佐特宝珠')
    expect(out).toContain('<w>}:</w> 2/15 枚符文：黏液，黄金')
  })

  it('preserves A: label and translates empty slots / regen / stats on the % overview screen', () => {
    const page = [
      'Health: 78/78      AC: 13    Str: 25    XL:     9',
      'Magic:  8/8        EV: 8     Int: 5     God:    Okawaru',
      'Gold:   290        SH: 4     Dex: 10    Spells: 0/8',
      'rPois   +          (33%)     (no helmet)',
      'HPRegen 0.33/turn            (no ring)',
      'MPRegen 0.11/turn',
      'A:   Horns 2, retaliatory headbutt',
    ].join('\n')
    const out = translatePage(page)
    expect(out).not.toContain('一阵')
    expect(out).toContain('A:')
    expect(out).toContain('力量: 25')
    expect(out).toContain('敏捷: 10')
    expect(out).toContain('(无头盔)')
    expect(out).toContain('(无戒指)')
    expect(out).toContain('生命回复 0.33/回合')
    expect(out).toContain('法力回复 0.11/回合')
  })
})
