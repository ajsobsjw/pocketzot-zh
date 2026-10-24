// @vitest-environment happy-dom

// The skills menu (`m`) is a fixed two-column terminal grid. Its name column is
// translated for display; the numeric columns must stay aligned, so the
// replacement pads to the original character width (a CJK glyph is 2 columns).
import { afterAll, describe, expect, it } from 'vitest'
import { localizeSkillRows } from '../views/skill-reflow'
import { setLang } from '.'

afterAll(() => setLang('en'))

describe('skill rows in Chinese', () => {
  it('translates the name and keeps the column width', async () => {
    await setLang('zh')
    const row = '    a  Fighting       5   23%  +2'
    const out = localizeSkillRows([row])
    expect(out[0]).toContain('格斗')
    expect(out[0]).toContain('5   23%  +2')
    // Same monospace width as the original row: a CJK glyph is two columns.
    const width = (s: string) => [...s].reduce((w, c) => w + (c.charCodeAt(0) > 0x2e80 ? 2 : 1), 0)
    expect(width(out[0])).toBe(width(row))
  })

  it('leaves English rows untouched', async () => {
    await setLang('zh')
    const row = '    a  Wobbling       0    0%   0'
    expect(localizeSkillRows([row])[0]).toBe(row)
  })

  it('handles the key+sign prefix and the header row', async () => {
    await setLang('zh')
    const rows = ['  a + Fighting        0.2   4%   -2', '     Skill       Level Train  Apt']
    const out = localizeSkillRows(rows)
    expect(out[0]).toContain('格斗')
    expect(out[0]).toContain('0.2   4%   -2')
    expect(out[1]).toContain('等级')
    expect(out[1]).toContain('训练')
    expect(out[1]).toContain('资质')
  })
})
