// @vitest-environment happy-dom
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { setLang } from './index'
import { translateGodLine, translateGodServiceFee } from './god'

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

  it.each([
    ['<yellow>A favoured servant of Zin.</yellow>', '<yellow>你是辛宠爱的仆从。</yellow>'],
    ['The Shining One is noncommittal.', '光辉者对你不置可否。'],
    ['Godly wrath is upon you!', '神罚已降临到你身上！'],
    ['Cheibriados supports your attributes. (+7)', '切布理亚多强化了你的属性。 (+7)'],
    ['Your health and magic regeneration is greatly accelerated.', '你的生命和法力回复速度大幅加快。'],
    ['You can recruit apostles that you defeat into your service.', '你可以招募被你击败的使徒为你效力。'],
  ])('probes %s', (english, chinese) => {
    expect(translateGodLine(english)).toBe(chinese)
  })

  it('keeps both gold amounts in Gozag’s fee and covers the free offer', () => {
    expect(translateGodServiceFee(' (125 gold; you have 57)')).toBe('（费用 125 金币，现有 57 金币）')
    expect(translateGodServiceFee(' (no fee if you join today)')).toBe('（现在加入免服务费）')
  })
})
