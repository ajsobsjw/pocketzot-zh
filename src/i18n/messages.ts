import { stripDcss } from '../game/dcss-colors'
import { isZh, t, tItem } from './index'

function displayFloorList(text: string): string | null {
  // items.cc emits the named contents of a floor stack as a separate
  // message, joined by "; ", with a colour run for each item.
  const parts = text.split('; ')
  if (parts.length < 2) return null
  const names = parts.map(part => stripDcss(part).trim())
  if (!names.every(name => /^(?:an?|the|some|\d+)\s+\S/i.test(name))) return null
  const translated = names.map(tItem)
  if (translated.every((name, i) => name === names[i])) return null

  return parts.map((part, i) => {
    if (translated[i] === names[i]) return part
    // Replace the text at the first visible run and keep the colour switches
    // in place, including ones that restore the colour for the next item.
    let inserted = false
    return part.split(/(<\/?[a-z]+>)/i).map((run, index) => {
      if (index % 2) return run
      if (inserted || !run.trim()) return ''
      inserted = true
      return translated[i]
    }).join('')
  }).join('；')
}

/** Translate the whole message before colour spans split it into fragments. */
export function displayMessageLine(text: string): string {
  if (!isZh()) return text
  const floorList = displayFloorList(text)
  if (floorList !== null) return floorList
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
