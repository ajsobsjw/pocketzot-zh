# setup-sync.ps1 — turn this folder into a local Git repository that tracks the
# upstream PocketZot project, so the Chinese localization layer can be rebased
# onto new upstream releases.
#
# Usage (after installing Git for Windows):
#   powershell -ExecutionPolicy Bypass -File .\setup-sync.ps1
#
# It only creates commits locally. Nothing is pushed anywhere.

[CmdletBinding()]
param(
  [string]$Upstream = 'https://github.com/pocketzot/pocketzot.git'
)

$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

$git = Get-Command git -ErrorAction SilentlyContinue
if (-not $git) {
  Write-Host "Git is not installed (or not on PATH)." -ForegroundColor Red
  Write-Host ""
  Write-Host "Install it, then open a NEW terminal:" -ForegroundColor Yellow
  Write-Host "  winget install --id Git.Git -e --accept-source-agreements --accept-package-agreements"
  Write-Host "  (or download from https://git-scm.com/download/win)"
  Write-Host ""
  Write-Host "Then run this script again."
  exit 1
}

Write-Host ("Using {0}" -f (& git --version)) -ForegroundColor DarkGray

if (-not (Test-Path (Join-Path $PSScriptRoot '.git'))) {
  Write-Host "Initialising repository..." -ForegroundColor Cyan
  & git init -b main 2>$null
  if ($LASTEXITCODE -ne 0) { & git init | Out-Null; & git checkout -b main 2>$null | Out-Null }
} else {
  Write-Host "Repository already initialised." -ForegroundColor DarkGray
}

# A neutral local identity: the history is a fork baseline, not a person.
& git config user.name "PocketZot zh fork" 2>$null
& git config user.email "fork@localhost" 2>$null

& git add -A
$pending = (& git status --porcelain).Count
if ($pending -gt 0) {
  & git commit -m "Chinese localization fork: initial import" | Out-Null
  Write-Host ("Committed {0} paths as the localization baseline." -f $pending) -ForegroundColor Green
} else {
  Write-Host "Nothing new to commit." -ForegroundColor DarkGray
}

$remotes = & git remote
if ($remotes -notcontains 'upstream') {
  & git remote add upstream $Upstream
  Write-Host ("Added upstream remote: {0}" -f $Upstream) -ForegroundColor Green
} else {
  Write-Host "upstream remote already present." -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "Local repository ready (version-control safety net + upstream remote)." -ForegroundColor White
Write-Host "Syncing is done by applying the patch to a fresh upstream clone: see SYNC.md." -ForegroundColor White
Write-Host ""
Write-Host "  git clone https://github.com/pocketzot/pocketzot.git ..\pocketzot-upstream"
Write-Host "  cd ..\pocketzot-upstream ; git checkout -b zh-localization"
Write-Host "  git apply --check ..\pocketzot\localization.patch"
Write-Host "  git apply ..\pocketzot\localization.patch"
Write-Host "  npm ci ; npx tsc ; npx vitest run ; npx vite build"
Write-Host ""
Write-Host "Regenerate the patch after local edits:" -ForegroundColor DarkGray
Write-Host "  node tools\make-localization-patch.mjs --base <原始上游快照>"

