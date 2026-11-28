import { renderMarkdown, type MdOptions } from '../util/markdown'
import { mountCardOverlay } from './overlay'
import { isZh, LANG_CHANGED_EVENT, tLabel } from '../i18n'

// A self-contained, full-screen modal that renders a markdown document.
// Mounted on document.body (via the shared card shell) so it floats above
// whichever view is active (login, lobby), and removed on close.
export function openDocView(title: string, markdown: string, opts?: MdOptions, zh?: string): void {
  const { body, titleEl } = mountCardOverlay(title, { body: 'doc-body' }, () => {
    window.removeEventListener(LANG_CHANGED_EVENT, render)
  })
  body.classList.add('no-i18n')
  titleEl.dataset.noI18n = ''
  function render(): void {
    const label = tLabel(title)
    titleEl.textContent = label
    body.innerHTML = renderMarkdown(isZh() && zh !== undefined ? zh : markdown, opts)
  }
  window.addEventListener(LANG_CHANGED_EVENT, render)
  render()
}
