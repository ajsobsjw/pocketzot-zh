#!/usr/bin/env node
// Fetch the offline engine + tile pack from the upstream deployment into a
// build directory, so a Cloudflare Pages upload can serve offline play.
//
//   node tools/fetch-offline.mjs --dist dist
//
// Files: /offline/{version.json,crawl.js,crawl.wasm.gz,crawl.data.gz,jspi/*,
// prewarm/*} and everything listed by /gamedata/local/manifest.json.
// Gzipped names fall back to their plain counterpart when the deployment
// predates them.
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'

const args = process.argv.slice(2)
const arg = (name, fallback) => {
  const i = args.indexOf(name)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}

const BASE = (arg('--base', 'https://pocketzot.app')).replace(/\/$/, '')
const DIST = resolve(arg('--dist', 'dist'))

async function get(path) {
  const res = await fetch(BASE + path)
  if (!res.ok) {
    const err = new Error(`${path}: HTTP ${res.status}`)
    err.status = res.status
    throw err
  }
  return Buffer.from(await res.arrayBuffer())
}

async function save(path, required = true) {
  try {
    const body = await get(path)
    const out = join(DIST, ...path.replace(/^\//, '').split('/'))
    await mkdir(dirname(out), { recursive: true })
    await writeFile(out, body)
    console.log(`${path}  ${(body.length / 1048576).toFixed(2)} MB`)
  } catch (e) {
    if (e.status === 404 && path.endsWith('.gz')) {
      return save(path.slice(0, -3), required)
    }
    if (!required) {
      console.log(`optional missing: ${path} (${e.message})`)
      return
    }
    throw e
  }
}

const ENGINE = [
  ['/offline/version.json', true],
  ['/offline/crawl.js', true],
  ['/offline/crawl.wasm.gz', true],
  ['/offline/crawl.data.gz', true],
  ['/offline/jspi/crawl.js', false],
  ['/offline/jspi/crawl.wasm.gz', false],
  ['/offline/prewarm/manifest.json', false],
  ['/offline/prewarm/prewarm.bin.gz', false],
]

for (const [path, required] of ENGINE) await save(path, required)

const manifestBody = await get('/gamedata/local/manifest.json')
const manifest = JSON.parse(manifestBody.toString('utf8'))
await save('/gamedata/local/manifest.json', true)
for (const file of manifest.files ?? []) {
  await save('/gamedata/local/' + file, true)
}

console.log('offline pack ready in', DIST)
