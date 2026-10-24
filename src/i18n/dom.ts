// DOM auto-translation.
//
// Views render English; this pass rewrites text nodes and a few attributes
// after they land in the document. It runs after the view's own synchronous
// work (parsing, reflow, hotkey extraction) has finished, which is exactly the
// "translate at the display boundary" rule.
//
// Skips: the map grid (glyphs must stay one character per cell), the CRT grid
// (80-column tables), form fields, chat, and anything marked data-no-i18n.

import { getLang, hasUiLabel, LANG_CHANGED_EVENT, t, tItem, tLabel } from './index'
import { translateLabeledText } from './body'

const SKIP_SELECTOR = '#map-grid, #crt-display, .no-i18n, .chat_sender, .chat_msg, script, style'
const SKIP_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'OPTION', 'CODE', 'PRE'])
const ATTRS = ['placeholder', 'aria-label', 'title', 'alt'] as const

const MAX_ORIGINALS = 4000
// Fragments that inline markup splits out of a sentence ("and", ", and",
// "Features"). The engine dictionary translates them by game context, which is
// wrong in prose, so they only go through the exact UI table.
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'to', 'of', 'in', 'on', 'at', 'by',
  'for', 'with', 'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been',
  'this', 'that', 'these', 'those', 'it', 'its', 'you', 'your', 'we', 'our',
])

let observer: MutationObserver | null = null
let root: HTMLElement | null = null
let queued: Node[] = []
let scheduled = false
const originals = new Map<Text, string>()
const attrOriginals = new Map<Element, Map<string, string>>()

function skipped(el: Element | null): boolean {
  for (let e = el; e; e = e.parentElement) {
    if (SKIP_TAGS.has(e.tagName)) return true
    if (e.matches(SKIP_SELECTOR)) return true
  }
  return false
}

// Attributes are translated on form fields too (their placeholder/aria-label is
// UI copy); only a skipped *ancestor* disqualifies them.
function skippedForAttrs(el: Element): boolean {
  if (el.matches(SKIP_SELECTOR)) return true
  for (let e = el.parentElement; e; e = e.parentElement) {
    if (SKIP_TAGS.has(e.tagName)) return true
    if (e.matches(SKIP_SELECTOR)) return true
  }
  return false
}

function remember(node: Text, value: string): void {
  if (originals.has(node)) return
  originals.set(node, value)
  if (originals.size > MAX_ORIGINALS) {
    let n = MAX_ORIGINALS / 4
    for (const k of originals.keys()) {
      originals.delete(k)
      if (--n <= 0) break
    }
  }
}

function translateText(node: Text): void {
  const value = node.nodeValue
  if (!value || value.length < 2) return
  if (!/[A-Za-z]/.test(value)) return
  if (skipped(node.parentElement)) return

  const lead = value.slice(0, value.length - value.trimStart().length)
  const trail = value.slice(value.trimEnd().length)
  const core = value.trim()
  const words = core.split(/\s+/)
  const fragment = !/[.!?]/.test(core) && (
    (words.length <= 1 && core.length < 6) || /^[,;:]/.test(core) || STOP_WORDS.has(core.toLowerCase())
  )
  const hotkeyRow = /^\s*(?:\([^)]\)|[A-Za-z0-9*!?])\s+[-+#$]\s+/.test(value)

  const label = tLabel(value)
  let out: string
  if (hasUiLabel(value)) out = label
  else if (hotkeyRow) out = tItem(value)
  else if (fragment) out = label
  else out = label !== value ? label : tItem(t(value))
  // Property rows ("rPois:  It protects…") and menu cards that build their own
  // text nodes: translate the label and the value separately.
  if (out === value) out = translateLabeledText(value) ?? value
  if (out === value) return
  // Preserve the node's own surrounding whitespace (inline layouts rely on it);
  // hotkey rows already carry their prefix from the item grammar.
  if (!hotkeyRow && (lead || trail) && !out.startsWith(lead)) out = lead + out.trim() + trail
  remember(node, value)
  node.nodeValue = out
}

function translateAttrs(el: Element): void {
  if (skippedForAttrs(el)) return
  for (const name of ATTRS) {
    const value = el.getAttribute(name)
    if (!value || !/[A-Za-z]/.test(value)) continue
    const out = tLabel(value)
    const final = hasUiLabel(value) || out !== value ? out : t(value)
    if (final === value) continue
    let map = attrOriginals.get(el)
    if (!map) {
      map = new Map()
      attrOriginals.set(el, map)
    }
    if (!map.has(name)) map.set(name, value)
    el.setAttribute(name, final)
  }
}

function walk(node: Node): void {
  if (node.nodeType === Node.TEXT_NODE) {
    translateText(node as Text)
    return
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return
  const el = node as Element
  // Whole subtrees that must stay verbatim are dropped before traversing them
  // (the map grid alone is thousands of glyph nodes per frame).
  if (el.matches(SKIP_SELECTOR)) return
  translateAttrs(el)
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT)
  let cur: Node | null
  while ((cur = walker.nextNode())) {
    if (cur.nodeType === Node.TEXT_NODE) translateText(cur as Text)
    else translateAttrs(cur as Element)
  }
}

function flush(): void {
  scheduled = false
  const batch = queued
  queued = []
  if (getLang() !== 'zh') return
  for (const node of batch) {
    if (node.isConnected) walk(node)
  }
}

function schedule(node: Node): void {
  queued.push(node)
  if (scheduled) return
  scheduled = true
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(flush)
  else setTimeout(flush, 16)
}

/** Revert every node we touched (used when switching back to English). */
function restore(): void {
  for (const [node, value] of originals) {
    if (node.isConnected && node.nodeValue !== value) node.nodeValue = value
  }
  originals.clear()
  for (const [el, map] of attrOriginals) {
    if (!el.isConnected) continue
    for (const [name, value] of map) el.setAttribute(name, value)
  }
  attrOriginals.clear()
}

export function installAutoTranslate(el: HTMLElement): () => void {
  root = el
  if (getLang() === 'zh') walk(el)
  observer = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === 'childList') {
        for (const n of r.addedNodes) schedule(n)
      } else if (r.type === 'characterData') {
        schedule(r.target)
      } else if (r.type === 'attributes' && r.target instanceof Element) {
        schedule(r.target)
      }
    }
  })
  observer.observe(el, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] })

  const onLang = (): void => {
    if (getLang() === 'zh') {
      if (root) walk(root)
    } else {
      restore()
    }
  }
  window.addEventListener(LANG_CHANGED_EVENT, onLang)

  return () => {
    observer?.disconnect()
    observer = null
    window.removeEventListener(LANG_CHANGED_EVENT, onLang)
  }
}
