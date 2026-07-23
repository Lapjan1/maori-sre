<#
.SYNOPSIS
  Deploys River World app from apps/ to docs/ for GitHub Pages.
.DESCRIPTION
  Build process:
    1. Copy app assets from apps/river-world/ to docs/
    2. Copy shared packages from packages/language-data/ to docs/packages/language-data/
    3. Copy voice-contrib from apps/voice-contrib/ to docs/voice-contrib/
    4. Rewrite dev-relative paths for deployment
    5. Validate every referenced asset exists
    6. Fail on any remaining ../../packages/ references
#>

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$SourceApp = Join-Path $RepoRoot "apps\river-world"
$SourceVC = Join-Path $RepoRoot "apps\voice-contrib"
$SourcePkg = Join-Path $RepoRoot "packages\language-data"
$Dest = Join-Path $RepoRoot "docs"
$DestPkg = Join-Path $Dest "packages\language-data"
$DestVC = Join-Path $Dest "voice-contrib"

$pass = $true

Write-Host "=== Deploy River World to GitHub Pages ===" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: Copy app assets ──────────────────────────────────
Write-Host "STEP 1/6: Copying app assets..." -ForegroundColor Yellow
$appFiles = @(
  "index.html", "app.js", "experiences.js", "surface_forms.js",
  "voice_packages.js", "audio_index.js", "session.js",
  "curriculum-wife.js", "audio.js", "sw.js", "manifest.json"
)
foreach ($f in $appFiles) {
  $src = Join-Path $SourceApp $f
  if (Test-Path $src) {
    Copy-Item -Path $src -Destination (Join-Path $Dest $f) -Force
    Write-Host "  OK  $f"
  } else {
    Write-Warning "  ??  $f not found (skipped)"
  }
}
foreach ($dir in @("voices", "assets")) {
  $srcDir = Join-Path $SourceApp $dir
  $dstDir = Join-Path $Dest $dir
  if (Test-Path $srcDir) {
    if (-not (Test-Path $dstDir)) { New-Item -ItemType Directory -Path $dstDir -Force | Out-Null }
    Copy-Item -Path "$srcDir\*" -Destination $dstDir -Recurse -Force
    Write-Host "  OK  $dir/"
  }
}

# ── Step 2: Copy shared packages ─────────────────────────────
Write-Host "STEP 2/6: Copying shared packages..." -ForegroundColor Yellow
if (-not (Test-Path $DestPkg)) { New-Item -ItemType Directory -Path $DestPkg -Force | Out-Null }
Copy-Item -Path "$SourcePkg\*.js" -Destination $DestPkg -Force
$cnt = (Get-ChildItem -Path $DestPkg -Filter "*.js").Count
Write-Host "  OK  $cnt package files"

# ── Step 3: Copy voice-contrib ───────────────────────────────
Write-Host "STEP 3/6: Copying voice-contrib..." -ForegroundColor Yellow
if (Test-Path $SourceVC) {
  if (-not (Test-Path $DestVC)) { New-Item -ItemType Directory -Path $DestVC -Force | Out-Null }
  Copy-Item -Path "$SourceVC\*" -Destination $DestVC -Recurse -Force
  Write-Host "  OK  voice-contrib/"
}

# ── Step 4: Rewrite paths ────────────────────────────────────
Write-Host "STEP 4/6: Rewriting deployment paths..." -ForegroundColor Yellow
$htmlFiles = Get-ChildItem -Path $Dest -Filter "*.html" -Recurse
foreach ($f in $htmlFiles) {
  $rel = $f.Directory.FullName.Substring($Dest.Length).TrimStart("\")
  $raw = Get-Content $f.FullName -Raw
  # Determine rewrite target based on depth from docs/
  if ($rel -eq "voice-contrib") {
    # depth 1: ../../packages/ -> ../packages/
    $new = $raw -replace "\.\./\.\./packages/language-data/", "../packages/language-data/"
  } else {
    # depth 0: ../../packages/ -> packages/
    $new = $raw -replace "\.\./\.\./packages/language-data/", "packages/language-data/"
  }
  Set-Content -Path $f.FullName -Value $new -NoNewline
  Write-Host "  OK  paths rewritten in $($f.Name)"
}

# ── Step 5: Validate assets exist ────────────────────────────
Write-Host "STEP 5/6: Validating asset references..." -ForegroundColor Yellow
foreach ($f in $htmlFiles) {
  $rel = $f.Directory.FullName.Substring($Dest.Length).TrimStart("\")
  $dir = $f.Directory.FullName
  $raw = Get-Content $f.FullName -Raw
  # Find all src="..." in script tags
  $i = 0
  while ($true) {
    $tagStart = $raw.IndexOf("<script", $i)
    if ($tagStart -lt 0) { break }
    $srcPos = $raw.IndexOf('src="', $tagStart)
    if ($srcPos -lt 0 -or $srcPos -gt $tagStart + 200) { $i = $tagStart + 7; continue }
    $valStart = $srcPos + 5
    $valEnd = $raw.IndexOf('"', $valStart)
    if ($valEnd -lt 0) { break }
    $scriptPath = $raw.Substring($valStart, $valEnd - $valStart)
    # Strip query string
    $qm = $scriptPath.IndexOf("?v=")
    if ($qm -ge 0) { $scriptPath = $scriptPath.Substring(0, $qm) }
    # Resolve to full path
    $fullPath = [System.IO.Path]::GetFullPath((Join-Path $dir $scriptPath))
    if (-not (Test-Path $fullPath)) {
      Write-Host "  FAIL  $($f.Name): missing $scriptPath" -ForegroundColor Red
      $pass = $false
    } else {
      Write-Host "  OK    $($f.Name): $scriptPath" -ForegroundColor Green
    }
    $i = $valEnd + 1
  }
}

# ── Step 6: Guard against forbidden paths ────────────────────
Write-Host "STEP 6/6: Checking for forbidden path patterns..." -ForegroundColor Yellow
$bad = $false
foreach ($f in $htmlFiles) {
  $raw = Get-Content $f.FullName -Raw
  if ($raw -match "\.\./\.\./packages/") {
    Write-Host "  FAIL  $($f.Name) contains '../../packages/'" -ForegroundColor Red
    $bad = $true
    $pass = $false
  }
}
if (-not $bad) { Write-Host "  OK    No forbidden paths found" -ForegroundColor Green }

# ── Report ───────────────────────────────────────────────────
Write-Host ""
if ($pass) {
  Write-Host "=== DEPLOY SUCCESS ===" -ForegroundColor Green
  Write-Host "Deployment ready at: $Dest" -ForegroundColor Green
} else {
  Write-Host "=== DEPLOY FAILED ===" -ForegroundColor Red
  Write-Host "Fix the issues above and re-run." -ForegroundColor Red
  exit 1
}
