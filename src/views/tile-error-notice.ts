// One-shot notice when tile art fails to load.
//
// In tiles mode a missing atlas degrades each cell to an ASCII glyph, which is
// indistinguishable from normal ASCII play — that ambiguity cost a debugging
// round, so the failure now says so on screen. The notice is informational; it
// never blocks input and disappears on its own.

const SEEN = new Set<string>()

export function installTileErrorNotice(): void {
  let el: HTMLElement | null = null
  let timer: ReturnType<typeof setTimeout> | null = null

  const show = (what: string): void => {
    if (SEEN.has(what)) return
    SEEN.add(what)
    if (!el) {
      el = document.createElement('div')
      el.className = 'tile-error-notice'
      el.style.cssText = [
        'position:fixed', 'left:50%', 'bottom:16px', 'transform:translateX(-50%)',
        'max-width:min(92vw,520px)', 'z-index:9999', 'padding:10px 14px',
        'border-radius:8px', 'background:#2a1d1d', 'color:#ffd9a0',
        'border:1px solid #7a4a2a', 'font:13px/1.5 system-ui,-apple-system,sans-serif',
        'box-shadow:0 6px 24px rgba(0,0,0,.5)',
      ].join(';')
      el.setAttribute('role', 'status')
      document.body.appendChild(el)
    }
    el.textContent = `图块加载失败：${what}（这些格子暂时用 ASCII 显示，可能是网络或资源缺失）`
    el.style.display = 'block'
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => { if (el) el.style.display = 'none' }, 12000)
  }

  const onError = (e: Event): void => {
    const detail = (e as CustomEvent<{ what?: string }>).detail
    if (detail?.what) show(detail.what)
  }
  window.addEventListener('pocketzot:tile-error', onError)

  window.addEventListener('beforeunload', () => {
    window.removeEventListener('pocketzot:tile-error', onError)
  }, { once: true })
}
