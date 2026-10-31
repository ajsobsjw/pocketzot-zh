// @vitest-environment happy-dom
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { setLang } from './index'
import { translateGodLine } from './god'

beforeAll(async () => { await setLang('zh') })
afterAll(async () => { await setLang('en') })

describe('god power rows', () => {
  it('translates known effects and costs without losing colour or indentation', () => {
    expect(translateGodLine('<yellow>You can recall your ancestor.')).toBe('<yellow>你可以召回你的先祖。')
    expect(translateGodLine('<yellow>    (2 MP, Piety-)')).toBe('<yellow>    （2 法力，虔诚-）')
    expect(translateGodLine('<yellow>    (8 MP, Piety----, Exhaustion, Drain)'))
      .toBe('<yellow>    （8 法力，虔诚----，疲劳，汲取）')
  })

  it('keeps unknown rows and costs intact', () => {
    expect(translateGodLine('<yellow>Unknown effect.')).toBe('<yellow>Unknown effect.')
    expect(translateGodLine('<yellow>    (2 MP, Mystery)')).toBe('<yellow>    (2 MP, Mystery)')
  })
})
