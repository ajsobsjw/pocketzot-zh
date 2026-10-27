// Development tool: collect the English lines the dictionary could not
// translate, so they can be added by frequency instead of by guesswork.
//
// The chip is only mounted in a dev build (or with ?i18n-miss=1). Clicking it
// downloads a tab-separated list: count<TAB>text.

const misses = new Map<string, number>()
const MAX = 4000

export function noteMiss(text: string): void {
  if (!text) return
  const t = text.trim()
  if (t.length < 3 || t.length > 8000) return
  if (!/[A-Za-z]{2}/.test(t)) return
  misses.set(t, (misses.get(t) ?? 0) + 1)
  if (misses.size > MAX) {
    let n = MAX / 4
    for (const k of misses.keys()) {
      misses.delete(k)
      if (--n <= 0) break
    }
  }
}

export function missCount(): number {
  return misses.size
}

export function missList(): string {
  return [...misses]
    .sort((a, b) => b[1] - a[1])
    .map(([text, n]) => `${n}\t${text.replace(/\n/g, '\\n')}`)
    .join('\n')
}

export function installMissPanel(): void {
  const chip = document.createElement('button')
  chip.type = 'button'
  chip.style.cssText = [
    'position:fixed', 'left:8px', 'bottom:8px', 'z-index:10000',
    'padding:6px 10px', 'border-radius:6px', 'border:1px solid #555',
    'background:rgba(20,20,20,.85)', 'color:#bbb', 'font:12px/1.2 system-ui,sans-serif',
    'cursor:pointer', 'opacity:.75',
  ].join(';')
  chip.title = '点击导出未翻译的英文句子（TSV：次数<TAB>原文）'
  document.body.appendChild(chip)

  const paint = (): void => { chip.textContent = `未命中 ${misses.size}` }
  paint()
  setInterval(paint, 3000)

  chip.addEventListener('click', () => {
    const blob = new Blob([missList()], { type: 'text/plain;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'i18n-misses.txt'
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 2000)
    paint()
  })
}
