import { stripDcss } from '../game/dcss-colors'
import { isZh, t } from './index'

/** Translate the whole message before colour spans split it into fragments. */
export function displayMessageLine(text: string): string {
  if (!isZh()) return text
  const plain = stripDcss(text)
  const translated = t(plain)
  if (translated === plain) return text
  // Keep the channel colour. Inline colours cannot follow reordered words.
  const lead = /^(?:<[a-z]+>)*/i.exec(text)?.[0] ?? ''
  return lead + translated
}

export function translateMessageHistory(text: string): string {
  if (!isZh()) return text
  // message.cc adds one prefix glyph to each row in replay_messages. It
  // can be in a separate colour run, even when the glyph is just a space.
  return text.split('\n').map((line) => {
    const prefix = /^(?:<\/?[a-z]+>)*[_ ]/i.exec(line)?.[0] ?? ''
    return prefix + displayMessageLine(line.slice(prefix.length))
  }).join('\n')
}
