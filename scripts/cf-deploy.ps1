param(
  # Build the Cloudflare bundle and run it locally in workerd. Publishes NOTHING.
  [switch]$Preview
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$envFile = Join-Path $root ".env.local"
if (-not (Test-Path $envFile)) {
  Write-Error "Missing .env.local. Run scripts/setup-supabase-db.ps1 first."
}

$dbLine = Select-String -Path $envFile -Pattern '^DATABASE_URL=' | Select-Object -First 1
if (-not $dbLine) {
  Write-Error "DATABASE_URL not found in .env.local"
}

$dbUrl = $dbLine.Line -replace '^DATABASE_URL=', '' -replace '^"', '' -replace '"$', ''
$env:CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE = $dbUrl

# This tree lives in OneDrive, which intermittently holds a handle on .open-next
# and makes the builder's own rm fail with EPERM. Clear it ourselves, with a few
# retries, so a sync in progress does not abort a deploy partway.
$outDir = Join-Path $root ".open-next"
if (Test-Path $outDir) {
  $cleared = $false
  foreach ($attempt in 1..5) {
    try {
      Remove-Item -Recurse -Force $outDir -ErrorAction Stop
      $cleared = $true
      break
    } catch {
      if ($attempt -eq 5) {
        Write-Error "Could not clear .open-next after 5 attempts (file lock, usually OneDrive). Close anything serving the bundle and retry.`n$($_.Exception.Message)"
      }
      Write-Host "  .open-next is locked (attempt $attempt/5) - retrying in 2s..."
      Start-Sleep -Seconds 2
    }
  }
  if ($cleared) { Write-Host "Cleared .open-next" }
}

# The bundle is always built against production config, so what you preview is
# byte-for-byte what a deploy would publish.
Write-Host "Building OpenNext bundle..."
dotenv -e .env.production -- opennextjs-cloudflare build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if ($Preview) {
  Write-Host ""
  Write-Host "Preview only - nothing is being published." -ForegroundColor Cyan
  Write-Host "Serving the production bundle locally in workerd. Ctrl+C to stop."
  Write-Host ""
  opennextjs-cloudflare preview
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "PUBLISHING TO THE LIVE SITE (crow-vo.com)" -ForegroundColor Yellow
Write-Host ""
# DNS-only tokens in .env.local must not override Wrangler OAuth for Workers deploy.
Remove-Item Env:CLOUDFLARE_API_TOKEN -ErrorAction SilentlyContinue
opennextjs-cloudflare deploy
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Deployed to crow-vo.com" -ForegroundColor Green
