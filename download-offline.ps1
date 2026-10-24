# download-offline.ps1 — fetch the offline engine + tile pack from the official
# deployment into dist/, so a Cloudflare Pages Direct Upload (drag & drop) can
# serve offline play without any Pages Functions.
#
# Run from anywhere:
#   powershell -ExecutionPolicy Bypass -File .\download-offline.ps1
#
# Optional:
#   -Dist  .\dist                 target folder (default: <script dir>\dist)
#   -Base  https://pocketzot.app  source origin
#   -Force                        re-download files that already exist
#
# The script is a no-op rebuild of what pocketzot.app serves; it does not touch
# your build output otherwise.

[CmdletBinding()]
param(
  [string]$Dist = (Join-Path $PSScriptRoot 'dist'),
  [string]$Base = 'https://pocketzot.app',
  [switch]$Force
)

$ErrorActionPreference = 'Stop'
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch { }
$ProgressPreference = 'SilentlyContinue'

$script:failures = New-Object System.Collections.ArrayList

function Get-Remote([string]$path, [string]$dest, [switch]$Optional) {
  if ((Test-Path $dest) -and -not $Force) {
    Write-Host ("  skip  {0} (exists)" -f $path) -ForegroundColor DarkGray
    return $true
  }
  $url = "$Base$path"
  $dir = Split-Path -Parent $dest
  if ($dir) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  try {
    Write-Host ("  get   {0}" -f $path) -ForegroundColor Cyan
    Invoke-WebRequest -UseBasicParsing -Uri $url -OutFile $dest -TimeoutSec 600
    return $true
  } catch {
    $code = $null
    if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
    # Engine/pack names ship gzipped first, plain as a fallback for older installs.
    if ($code -eq 404 -and $path.EndsWith('.gz')) {
      return (Get-Remote ($path.Substring(0, $path.Length - 3)) ($dest.Substring(0, $dest.Length - 3)) -Optional:$Optional)
    }
    if ($Optional) {
      Write-Host ("  opt?  {0}  ({1})" -f $path, $_.Exception.Message) -ForegroundColor DarkYellow
      return $false
    }
    Write-Host ("  MISS  {0}  ({1})" -f $path, $_.Exception.Message) -ForegroundColor Yellow
    [void]$script:failures.Add("$path ($code)")
    return $false
  }
}

function Get-Json([string]$path, [string]$dest) {
  if (-not (Get-Remote $path $dest)) { return $null }
  try {
    return (Get-Content -Raw -LiteralPath $dest) | ConvertFrom-Json
  } catch {
    Write-Host ("  BAD JSON {0}: {1}" -f $path, $_.Exception.Message) -ForegroundColor Yellow
    return $null
  }
}

$Dist = [IO.Path]::GetFullPath($Dist)
if (-not (Test-Path (Join-Path $Dist 'index.html'))) {
  Write-Host "WARNING: $Dist has no index.html — run the build first, then this script." -ForegroundColor Yellow
}

Write-Host "== Engine (offline/) ==" -ForegroundColor White
$engine = @(
  '/offline/version.json',
  '/offline/crawl.js',
  '/offline/crawl.wasm.gz',
  '/offline/crawl.data.gz',
  '/offline/jspi/crawl.js',
  '/offline/jspi/crawl.wasm.gz',
  '/offline/prewarm/manifest.json',
  '/offline/prewarm/prewarm.bin.gz'
)
foreach ($p in $engine) {
  # JSPI is a second engine build for very new browsers; prewarm is optional at
  # deploy time and the engine rebuilds its caches without it.
  $optional = $p -like '/offline/jspi/*' -or $p -like '/offline/prewarm/*'
  [void](Get-Remote $p (Join-Path $Dist $p.TrimStart('/').Replace('/', '\')) -Optional:$optional)
}

Write-Host "== Tiles (gamedata/local/) ==" -ForegroundColor White
$tilesRoot = Join-Path $Dist 'gamedata\local'
$manifestPath = Join-Path $tilesRoot 'manifest.json'
$manifest = Get-Json '/gamedata/local/manifest.json' $manifestPath
if ($manifest -and $manifest.files) {
  foreach ($f in $manifest.files) {
    [void](Get-Remote "/gamedata/local/$f" (Join-Path $tilesRoot ($f -replace '/', '\')))
  }
} else {
  Write-Host "  no manifest.json usable — falling back to the known 0.35 file set" -ForegroundColor Yellow
  $fallback = @(
    'enums.js', 'feat.png', 'floor.png', 'gui.png', 'icons.png', 'main.png', 'player.png',
    'status-icon-sizes.js', 'tileinfo-dngn.js', 'tileinfo-feat.js', 'tileinfo-floor.js',
    'tileinfo-gui.js', 'tileinfo-icons.js', 'tileinfo-main.js', 'tileinfo-player.js',
    'tileinfo-wall.js', 'wall.png'
  )
  foreach ($f in $fallback) {
    [void](Get-Remote "/gamedata/local/$f" (Join-Path $tilesRoot $f))
  }
}

Write-Host ""
Write-Host "== Verify ==" -ForegroundColor White
$files = Get-ChildItem -LiteralPath $Dist -Recurse -File
$total = ($files | Measure-Object -Property Length -Sum).Sum
$largest = $files | Sort-Object Length -Descending | Select-Object -First 1
Write-Host ("files={0}  total={1:N2} MB  largest={2:N2} MB ({3})" -f `
  $files.Count, ($total / 1MB), ($largest.Length / 1MB), $largest.Name)

$limit = 25MB
$over = $files | Where-Object { $_.Length -gt $limit }
if ($over) {
  Write-Host ""; Write-Host "ERROR: these files exceed Cloudflare Pages' 25 MiB per-file limit:" -ForegroundColor Red
  $over | ForEach-Object { Write-Host ("  {0}  {1:N1} MB" -f $_.FullName, ($_.Length / 1MB)) }
  Write-Host "Pages Direct Upload will reject the deployment. Host the offline pack elsewhere," -ForegroundColor Yellow
  Write-Host "or use a Pages Function / _worker.js proxy instead of static files." -ForegroundColor Yellow
}
if ($files.Count -gt 1000) {
  Write-Host ("WARNING: {0} files — drag & drop allows 1000 per deployment; use Wrangler." -f $files.Count) -ForegroundColor Yellow
}

if ($script:failures.Count -gt 0) {
  Write-Host ""
  Write-Host "Some files could not be downloaded:" -ForegroundColor Red
  $script:failures | ForEach-Object { Write-Host "  $_" }
  exit 1
}

Write-Host ""
Write-Host "Done. Upload the folder $Dist (or a zip of its contents) to Cloudflare Pages." -ForegroundColor Green
Write-Host "Keep _headers, _redirects and 404.html in the uploaded folder." -ForegroundColor Green
