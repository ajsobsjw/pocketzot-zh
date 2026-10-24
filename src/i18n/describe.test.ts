// @vitest-environment happy-dom

// Phase D (light): describe bodies get their prose block replaced by the
// localized database entry, keyed by the name in the overlay title.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { loadDescript, zhDescribe, describeName } from './describe'
import { setLang } from './index'

const BODY = '<lightgrey>\n\nA large, loose-fitting, wide-sleeved outer garment made of light cloth.\n\nBase armour rating: 2       Encumbrance rating: 0\n\nIt can be maximally enchanted to +2.'

beforeAll(async () => {
  await setLang('zh')
  await loadDescript()
})

afterAll(() => setLang('en'))

describe('describe replacement', () => {
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

  it('returns null when the name is unknown', () => {
    expect(zhDescribe('a - a wobbling gizmo', BODY)).toBeNull()
  })
})
