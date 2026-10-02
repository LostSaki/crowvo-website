# Sets Crowvo API secrets on the Cloudflare Worker (marketing site admin proxy).
# Run from crowvo-website after Railway API is live.
#
# Usage:
#   powershell -File scripts/setup-crowvo-api-secrets.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$apiUrl = "https://api.crow-vo.com/v1"
$secretsFile = Join-Path (Split-Path -Parent $root) "crowvo-app\backend\.railway-secrets.local"

if (Test-Path $secretsFile) {
  $content = Get-Content $secretsFile -Raw
  if ($content -match 'ADMIN_API_KEY="([^"]+)"') {
    $adminKey = $Matches[1]
  } else {
    throw "ADMIN_API_KEY not found in $secretsFile"
  }
} else {
  throw "Missing $secretsFile - deploy Railway API first."
}

Write-Host "Setting CROWVO_API_URL = $apiUrl"
$apiUrl | npx wrangler secret put CROWVO_API_URL

Write-Host "Setting CROWVO_ADMIN_API_KEY (from Railway secrets)"
$adminKey | npx wrangler secret put CROWVO_ADMIN_API_KEY

Write-Host "Done. Redeploy with: npm run cf:deploy"
