// Describe overlays arrive as pre-arranged text, so the DOM translator never
// sees a sentence on its own: property rows come as "rPois:     It protects…"
// and the label/value share one text node. This runs on the assembled body
// before it is rendered: translate the label (property token), then the
// sentence, and re-pad so the value column stays where the engine put it.

import { isZh, t } from './index'
import { propLabel } from './items'

function displayWidth(s: string): number {
  let n = 0
  for (const ch of s) n += /[^\x00-\xff]/.test(ch) ? 2 : 1
  return n
}

/** Translate one "Label: value" cell, re-padding the value to its old column. */
function translateCell(cell: string): string {
  const m = /^(\s*)(\S+?):(\s+)(.+)$/.exec(cell)
  if (!m) return cell
  const label = propLabel(m[2])
  const desc = t(m[4])
  if (label !== m[2] || desc !== m[4]) {
    const target = displayWidth(m[2]) + m[3].length
    const pad = Math.max(1, target - displayWidth(label))
    return tidy(`${m[1]}${label}:${' '.repeat(pad)}${desc}`)
  }
  // Labels outside the property table ("Base armour rating", "Encumbrance
  // rating") are ordinary dictionary keys: try the whole cell.
  const whole = t(cell.trim())
  return whole === cell.trim() ? cell : cell.slice(0, cell.length - cell.trimStart().length) + tidy(whole)
}

/** Translate the property/value rows and stray sentences of a describe body. */
export function translateBody(body: string): string {
  if (!isZh() || !body) return body
  // The engine hard-wraps long property values ("Flame:  It burns victims,\n
  // dealing …"). Join indented continuation lines back onto their label so the
  // sentence can match; the overlay wraps the merged line again on screen.
  const raw = body.split('\n')
  const lines: string[] = []
  for (let i = 0; i < raw.length; i++) {
    const line = raw[i]
    const label = /^(\s*\S+?):\s+\S/.exec(line)
    if (label && i + 1 < raw.length) {
      let value = line
      while (i + 1 < raw.length
        && /^\s{2,}\S/.test(raw[i + 1])
        && !/^\s*\S+?:\s/.test(raw[i + 1])
        && !/^\s*$/.test(raw[i + 1])) {
        value += ' ' + raw[i + 1].trim()
        i++
      }
      lines.push(value)
      continue
    }
    lines.push(line)
  }
  return lines.map((line) => {
    // Rows can carry several labelled cells separated by the engine's column
    // gaps ("Base armour rating: 2       Encumbrance rating: 0"): translate
    // each cell on its own, keep the gaps.
    const pieces = line.split(/(\s{2,})/)
    if (pieces.length > 1) {
      let changed = false
      const out = pieces.map((piece, i) => {
        if (i % 2 === 1) return piece
        const lead = piece.slice(0, piece.length - piece.trimStart().length)
        const text = piece.trim()
        if (!text) return piece
        // Label-only cell (the value lives in the next column).
        const labelOnly = /^(\S+?):$/.exec(text)
        if (labelOnly) {
          const label = propLabel(labelOnly[1])
          if (label !== labelOnly[1]) {
            changed = true
            return lead + label + ':'
          }
        }
        const cell = translateCell(text)
        if (cell !== text) {
          changed = true
          return lead + cell
        }
        const whole = t(text)
        if (whole !== text) {
          changed = true
          return lead + tidy(whole)
        }
        return piece
      }).join('')
      if (changed) return out
    }
    const cell = translateCell(line)
    if (cell !== line) return cell
    const trimmed = line.trim()
    if (!trimmed) return line
    const zh = t(trimmed)
    if (zh !== trimmed) return line.slice(0, line.length - line.trimStart().length) + tidy(zh)
    return line
  }).join('\n')
}

/** One "label: value" text node, for the DOM translator (menus included). */
export function translateLabeledText(text: string): string | null {
  if (!isZh()) return null
  const m = /^(\s*)(\S+?):(\s+)(.*)$/.exec(text)
  if (!m) return null
  const label = propLabel(m[2])
  const desc = m[4] ? t(m[4]) : ''
  if (label === m[2] && desc === m[4]) return null
  const target = displayWidth(m[2]) + m[3].length
  const pad = Math.max(1, target - displayWidth(label))
  return tidy(`${m[1]}${label}:${' '.repeat(pad)}${desc}`)
}

/** Chinese typography for lines the dictionary left with ASCII punctuation. */
function tidy(s: string): string {
  if (!/[\u4e00-\u9fff]/.test(s)) return s
  return s.replace(/\s*->\s*/g, ' → ').replace(/\.\s*$/, '。')
}
