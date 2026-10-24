import './style.css'
import { initApp } from './app'
import { initUiScale } from './ui-scale'
import { initStatusBlur } from './status-blur'
import { maybeMountSafeAreaProbe } from './safe-area-probe'
import { registerServiceWorker } from './sw/register'
import { count } from './counter'
import { consumeStaleShellHeal } from './util/self-heal'
import { getLang, initI18n } from './i18n'
import { installAutoTranslate } from './i18n/dom'
import { installTileErrorNotice } from './views/tile-error-notice'

// First: "booted" for the stale-shell heal means this chunk ran, and the
// healed-load mark must exist before anything below can fail (self-heal.ts).
const healed = consumeStaleShellHeal()

const appEl = document.getElementById('app')
if (!appEl) throw new Error('#app element not found')

// Before the first view mounts, so nothing lays out at stock size first.
initUiScale()
// Without this, iOS never paints :active: WebKit forwards a touch to the
// page only where a touch/pointer/mouse listener covers the point
// (WebPageProxy::touchEventTrackingType), and :active is set by that
// dispatch — Apple's Safari Web Content Guide, "Highlighting Elements".
// Passive, so WebKit dispatches it unpreventably and it can't hold up
// scrolling. Never make it non-passive.
document.addEventListener('touchstart', () => {}, { capture: true, passive: true })
// iOS keeps :active on a touched element through a scroll until the finger
// lifts: the pan fires pointercancel (WebKit PointerCaptureController::
// cancelPointer, a read-only hit test) but never releases the active
// state. Observed on device 2026-09-25: a lobby row lit and stayed lit
// while the list scrolled. The delayed row press rules are gated on this
// class (see --press-delay in style.css).
const rootEl = document.documentElement
document.addEventListener('pointercancel', () => rootEl.classList.add('press-cancelled'), { capture: true, passive: true })
document.addEventListener('pointerdown', () => rootEl.classList.remove('press-cancelled'), { capture: true, passive: true })
// Held on installed iOS until the swap lands (status-blur.ts).
initStatusBlur(() => {
  // Dictionary first (no-op in English): every view below then renders through
  // the display layer. The auto-translator is installed before the first view
  // mounts, so its initial DOM is covered as well.
  void initI18n().then(async () => {
    if (getLang() === 'zh') {
      document.documentElement.lang = 'zh-CN'
      // Describe overlays use a second, lazily loaded table (dat/descript/zh).
      const { loadDescript } = await import('./i18n/describe')
      await loadDescript()
    }
    // The whole body: settings/login overlays mount outside #app, and the map
    // grid is skipped by the translator's own selector.
    installAutoTranslate(document.body)
    initApp(appEl)
    installTileErrorNotice()
    // Dev-only: a chip that exports the English lines the dictionary missed,
    // so they can be added by frequency.
    if (import.meta.env.DEV || new URLSearchParams(location.search).has('i18n-miss')) {
      void import('./i18n/miss-log').then((m) => m.installMissPanel())
    }
    maybeMountSafeAreaProbe()
  })
})
registerServiceWorker()
count('boot') // boot rows self-attach the W/C environment letters (counter.ts)
if (healed) count('stale-heal')
// __dcssCardDemo() — character-card gallery from fixtures (views/card-demo.ts).
// Dynamic import inside the DEV branch: the chunk isn't emitted in prod.
if (import.meta.env.DEV) void import('./views/card-demo').then((m) => m.installCardDemo())
