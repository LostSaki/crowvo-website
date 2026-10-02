param(
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

Write-Host "Building OpenNext bundle..."
dotenv -e .env.production -- opennextjs-cloudflare build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Deploying to Cloudflare..."
# DNS-only tokens in .env.local must not override Wrangler OAuth for Workers deploy.
Remove-Item Env:CLOUDFLARE_API_TOKEN -ErrorAction SilentlyContinue
opennextjs-cloudflare deploy
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if ($Preview) {
  dotenv -e .env.local -- opennextjs-cloudflare preview
}
