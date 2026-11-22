// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setLang, tItem, tMore, tTitle } from './index'
import { loadDescript } from './describe'
import { translateOverviewMarkup, translatePage } from './pages'
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
    expect(sv.element.textContent).toContain('Shshssjdj')

    sv.update({ ac: 13, str: 25 })
    expect(sv.element.querySelector('#hud-ac')?.textContent).toBe('13')
    expect(sv.element.querySelector('#hud-str')?.textContent).toBe('25')

    await setLang('en')
    expect(sv.element.querySelector('#hud-ac')?.textContent).toBe('13')
    expect(sv.element.textContent).toContain('AC')
    sv.dispose()
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
