// @vitest-environment happy-dom

// Phase D (light): describe bodies get their prose block replaced by the
// localized database entry, keyed by the name in the overlay title.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { loadDescript, zhDescribe, describeName, translateGodSection } from './describe'
import { setLang } from './index'

const BODY = '<lightgrey>\n\nA large, loose-fitting, wide-sleeved outer garment made of light cloth.\n\nBase armour rating: 2       Encumbrance rating: 0\n\nIt can be maximally enchanted to +2.'

beforeAll(async () => {
  await setLang('zh')
  await loadDescript()
})

afterAll(() => setLang('en'))

describe('describe replacement', () => {
  it('translates complete god sections independently and preserves unknown sections', () => {
    expect(translateGodSection('Trog', 'description', 'First paragraph.\n\nSecond paragraph.')).toContain('特洛格')
    expect(translateGodSection('Trog', 'powers', 'English powers.')).toContain('狂暴')
    expect(translateGodSection('the Shining One', 'wrath', 'English wrath.')).toContain('光辉者')
    expect(translateGodSection('Unknown God', 'powers', 'Unknown powers.')).toBe('Unknown powers.')
    expect(translateGodSection('Trog', 'powers', '')).toBe('')
  })
  it('derives the database name from an overlay title', () => {
    expect(describeName('a - a +0 robe (worn).')).toBe('robe')
    expect(describeName('z - a ball python')).toBe('ball python')
    expect(describeName('the Shining One')).toBe('Shining One')
  })

  it('replaces the prose and keeps the computed lines', () => {
    const out = zhDescribe('a - a +0 robe (worn).', BODY)
    expect(out).toBeTruthy()
    expect(out).toContain('宽松')
    expect(out).toContain('Base armour rating: 2')
    expect(out).not.toContain('A large, loose-fitting')
  })

  it('keeps a monster stat block below the prose', () => {
    const body = 'A small snake.\n\nMax HP: ~10\n\nWill: +\n\nAC: +'
    const out = zhDescribe('z - a ball python', body)
    expect(out).toContain('蛇')
    expect(out).toContain('Max HP: ~10')
    expect(out).toContain('Will: +')
  })

  it('handles monsters', () => {
    const out = zhDescribe('z - a ball python', 'A small snake.\n\nIt bites.')
    expect(out).toContain('蛇')
  })

  it('uses the spell catalogue exclusively for spell pages and preserves the current Airstrike prose', () => {
    const spell = zhDescribe('Airstrike', 'A monster description shared with another catalogue.', 'describe-spell')
    expect(spell).toContain('使目标生物周围的空气扭曲成一团狂暴的气旋')
    expect(spell).not.toContain('怪物描述')
  })

  it('does not substitute another kind of entry when a typed title is unknown', () => {
    expect(zhDescribe('a - Unknown Spell', 'Unknown spell prose.', 'describe-spell')).toBeNull()
    expect(zhDescribe('a - Unlisted Monster', 'Unknown monster prose.', 'describe-monster')).toBeNull()
  })

  it('returns null when the name is unknown', () => {
    expect(zhDescribe('a - a wobbling gizmo', BODY)).toBeNull()
  })
})
