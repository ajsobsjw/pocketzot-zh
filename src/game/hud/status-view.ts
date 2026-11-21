import type { PlayerStatus } from '../../ws/types'
import { statusColor } from '../map/colors'
import { dcssToHtml } from '../dcss-colors'
import { isZh, LANG_CHANGED_EVENT } from '../../i18n'
import { translateStatusLight, translateStatusTooltip } from '../../i18n/status'

function localizeStatusHtml(raw: string): string {
  if (!isZh()) return dcssToHtml(raw)
  const parts = raw.split(/(<[^>]+>)/)
  if (parts.length === 1) return dcssToHtml(translateStatusLight(raw))
  const lead = /^(\s*)([A-Za-z0-9+!-]+)(\s*\()/.exec(parts[0])
  if (lead) {
    const zh = translateStatusLight(lead[2])
    if (zh !== lead[2]) parts[0] = lead[1] + zh + lead[3] + parts[0].slice(lead[0].length)
  } else {
    for (let i = 0; i < parts.length; i += 2) {
      if (!parts[i].trim()) continue
      const leadWs = parts[i].slice(0, parts[i].length - parts[i].trimStart().length)
      const trailWs = parts[i].slice(parts[i].trimEnd().length)
      parts[i] = leadWs + translateStatusLight(parts[i].trim()) + trailWs
    }
  }
  return dcssToHtml(parts.join(''))
}

// Renders the row of coloured status effect lights (Haste, Slow, Poison, etc.)
export class StatusView {
  private el: HTMLElement
  private lastStatuses: PlayerStatus[] = []
  private readonly onLangChange = (): void => {
    if (this.lastStatuses.length > 0) this.render()
  }

  constructor() {
    this.el = document.createElement('div')
    this.el.id = 'hud-status'
    window.addEventListener(LANG_CHANGED_EVENT, this.onLangChange)
  }

  get element(): HTMLElement {
    return this.el
  }

  dispose(): void {
    window.removeEventListener(LANG_CHANGED_EVENT, this.onLangChange)
  }

  update(statuses: PlayerStatus[]): void {
    this.lastStatuses = statuses
    this.render()
  }

  private render(): void {
    this.el.textContent = ''
    for (const s of this.lastStatuses) {
      if (!s.light) continue
      const span = document.createElement('span')
      span.className = 'status-light'
      if (s.use_html) span.innerHTML = localizeStatusHtml(s.light)
      else span.textContent = translateStatusLight(s.light)
      span.style.color = statusColor(s.col)
      if (s.text) span.title = translateStatusTooltip(s.text)
      this.el.appendChild(span)
    }
  }
}
