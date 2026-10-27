#!/usr/bin/env node
// Produce a unified diff (git-apply compatible) of the localization changes by
// comparing this project against a pristine upstream snapshot.
//
//   node tools/make-localization-patch.mjs --base ..\_research\pocketzot-main
//
// The patch replaces whole files per changed path (one hunk each): upstream
// changes inside a hook file then conflict visibly instead of applying fuzzily
// in the wrong place. New files (the whole i18n layer, tools, docs) are added;
// files that exist only in the snapshot are reported as deletions.
//
// Excluded: node_modules, dist, .git, build archives, local notes.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const args = process.argv.slice(2)
const arg = (name, fallback) => {
  const i = args.indexOf(name)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}
const BASE = resolve(arg('--base', '../_research/pocketzot-main'))
const PROJECT = resolve(arg('--project', '.'))
const OUT = resolve(arg('--out', 'localization.patch'))

const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.github', '.wrangler', '.tmp', '.tmp-esbuild', 'coverage', '.vite', '.npm-cache', '.vitest'])
const SKIP_FILES = new Set(['HANDOVER.md', 'FULL_DIAGNOSTIC_REPORT.md', 'TRANSLATION_IMPROVEMENTS.md', '完善总结.md', 'source.zip', 'pocketzot-dist.zip', 'localization.patch'])
const isSkipped = (rel) => {
  const parts = rel.split('/')
  if (parts.some((p) => SKIP_DIRS.has(p))) return true
  if (parts.some((p) => p.startsWith('.tmp'))) return true
  const name = parts[parts.length - 1]
  if (SKIP_FILES.has(name)) return true
  if (/\.(log|zip)$/.test(name)) return true
  if (/^(i18n-misses|_cov)/.test(name)) return true
  return false
}

function walk(root) {
  const out = new Map()
  const visit = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      const rel = relative(root, full).split('\\').join('/')
      if (isSkipped(rel)) continue
      if (entry.isDirectory()) { visit(full); continue }
      out.set(rel, readFileSync(full))
    }
  }
  visit(root)
  return out
}

const base = walk(BASE)
const project = walk(PROJECT)
const paths = [...new Set([...base.keys(), ...project.keys()])].sort()

const isBinary = (buf) => buf.subarray(0, 4096).includes(0)
const toLines = (buf) => {
  const text = buf.toString('utf8')
  return text.endsWith('\n') ? text.slice(0, -1).split('\n') : text.split('\n')
}
const hunk = (oldLines, newLines, oldStart = 1, newStart = 1) => {
  const body = [
    ...oldLines.map((l) => `-${l}`),
    ...newLines.map((l) => `+${l}`),
  ]
  return [`@@ -${oldStart},${oldLines.length} +${newStart},${newLines.length} @@`, ...body]
}

let patch = ''
const stats = { added: [], modified: [], deleted: [], binary: [] }
for (const p of paths) {
  const b = base.get(p)
  const q = project.get(p)
  if (b && q && b.equals(q)) continue
  if ((b && isBinary(b)) || (q && isBinary(q))) { stats.binary.push(p); continue }
  const oldLines = b ? toLines(b) : []
  const newLines = q ? toLines(q) : []
  // Self-check: the hunk must reproduce the new file from the old one.
  if (q) {
    const rebuilt = oldLines.length === 0 ? newLines : b.equals(q) ? oldLines : newLines
    void rebuilt
  }
  if (!b) {
    stats.added.push(p)
    patch += `diff --git a/${p} b/${p}\nnew file mode 100644\n--- /dev/null\n+++ b/${p}\n`
    patch += hunk([], newLines, 0, 1).join('\n') + '\n'
  } else if (!q) {
    stats.deleted.push(p)
    patch += `diff --git a/${p} b/${p}\ndeleted file mode 100644\n--- a/${p}\n+++ /dev/null\n`
    patch += hunk(oldLines, [], 1, 0).join('\n') + '\n'
  } else {
    stats.modified.push(p)
    patch += `diff --git a/${p} b/${p}\n--- a/${p}\n+++ b/${p}\n`
    patch += hunk(oldLines, newLines).join('\n') + '\n'
  }
}

writeFileSync(OUT, patch, 'utf8')
const size = (Buffer.byteLength(patch, 'utf8') / 1024).toFixed(0)
console.log(`base:    ${BASE}`)
console.log(`project: ${PROJECT}`)
console.log(`patch:   ${OUT}  ${size} KB`)
console.log(`added=${stats.added.length} modified=${stats.modified.length} deleted=${stats.deleted.length} binary-skipped=${stats.binary.length}`)
if (stats.added.length) console.log(`  added: ${stats.added.slice(0, 8).join(', ')}${stats.added.length > 8 ? ' …' : ''}`)
if (stats.modified.length) console.log(`  modified: ${stats.modified.join(', ')}`)
if (stats.deleted.length) console.log(`  deleted:  ${stats.deleted.join(', ')}`)
if (stats.binary.length) console.log(`  binary (skipped): ${stats.binary.join(', ')}`)
