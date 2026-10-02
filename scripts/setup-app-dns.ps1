# Wire app.crow-vo.com to the Crowvo web app on Vercel.
#
# Usage:
#   $env:CLOUDFLARE_API_TOKEN = "your-token"
#   .\scripts\setup-app-dns.ps1
#
# Or add CLOUDFLARE_API_TOKEN to crowvo-website/.env.local (never commit it).

$ErrorActionPreference = "Stop"
$ZoneId = "4f171d7dd975e910756c7371e7fcd71c"
$RecordName = "app"
$RecordContent = "76.76.21.21"
$Fqdn = "app.crow-vo.com"

function Get-CloudflareToken {
  if ($env:CLOUDFLARE_DNS_API_TOKEN) { return $env:CLOUDFLARE_DNS_API_TOKEN.Trim() }
  if ($env:CLOUDFLARE_API_TOKEN) { return $env:CLOUDFLARE_API_TOKEN.Trim() }
  $envLocal = Join-Path (Join-Path $PSScriptRoot "..") ".env.local"
  if (Test-Path $envLocal) {
    foreach ($pattern in @('^CLOUDFLARE_DNS_API_TOKEN=', '^CLOUDFLARE_API_TOKEN=')) {
      $line = Select-String -Path $envLocal -Pattern $pattern | Select-Object -First 1
      if ($line) {
        return ($line.Line -replace $pattern, '').Trim().Trim('"').Trim("'")
      }
    }
  }
  return $null
}

function Invoke-CloudflareApi {
  param([string]$Method, [string]$Uri, [object]$Body = $null)
  $headers = @{
    Authorization = "Bearer $script:Token"
    "Content-Type" = "application/json"
  }
  $params = @{ Method = $Method; Uri = $Uri; Headers = $headers }
  if ($Body) { $params.Body = ($Body | ConvertTo-Json -Compress) }
  return Invoke-RestMethod @params
}

Write-Host "`n=== app.crow-vo.com DNS setup ===`n"

$script:Token = Get-CloudflareToken
if (-not $script:Token) {
  Write-Host @"
No CLOUDFLARE_API_TOKEN found.

Create a token:
  1. https://dash.cloudflare.com/profile/api-tokens
  2. Create Token -> Edit zone DNS (template) OR Custom token:
       Permissions: Zone -> DNS -> Edit
       Zone Resources: Include -> Specific zone -> crow-vo.com
  3. Create and copy the token (shown once)

Then run:
  `$env:CLOUDFLARE_API_TOKEN = "paste-token-here"
  .\scripts\setup-app-dns.ps1

Or add to crowvo-website/.env.local:
  CLOUDFLARE_API_TOKEN=your-token-here

Manual fallback (Cloudflare Dashboard -> crow-vo.com -> DNS):
  Type: A | Name: app | Content: 76.76.21.21 | Proxy: DNS only (grey cloud)
"@
  exit 1
}

Write-Host "Token found. Checking existing DNS records for $Fqdn..."
try {
  $existing = Invoke-CloudflareApi -Method GET `
    -Uri "https://api.cloudflare.com/client/v4/zones/$ZoneId/dns_records?type=A&name=$Fqdn"
} catch {
  Write-Host "Cloudflare API error: $_"
  Write-Host "Check that the token has Zone.DNS:Edit for crow-vo.com."
  exit 1
}

if (-not $existing.success) {
  Write-Host "API failed: $($existing.errors | ConvertTo-Json -Compress)"
  exit 1
}

$record = $existing.result | Where-Object { $_.name -eq $Fqdn -and $_.type -eq "A" } | Select-Object -First 1

if ($record) {
  if ($record.content -eq $RecordContent -and $record.proxied -eq $false) {
    Write-Host "DNS record already correct: $Fqdn -> $RecordContent (DNS only)"
  } else {
    Write-Host "Updating existing A record ($($record.id))..."
    $update = Invoke-CloudflareApi -Method PUT `
      -Uri "https://api.cloudflare.com/client/v4/zones/$ZoneId/dns_records/$($record.id)" `
      -Body @{ type = "A"; name = $RecordName; content = $RecordContent; ttl = 1; proxied = $false }
    if (-not $update.success) {
      Write-Host "Update failed: $($update.errors | ConvertTo-Json -Compress)"
      exit 1
    }
    Write-Host "Updated $Fqdn -> $RecordContent (DNS only)"
  }
} else {
  Write-Host "Creating A record $Fqdn -> $RecordContent (DNS only)..."
  $create = Invoke-CloudflareApi -Method POST `
    -Uri "https://api.cloudflare.com/client/v4/zones/$ZoneId/dns_records" `
    -Body @{ type = "A"; name = $RecordName; content = $RecordContent; ttl = 1; proxied = $false }
  if (-not $create.success) {
    Write-Host "Create failed: $($create.errors | ConvertTo-Json -Compress)"
    exit 1
  }
  Write-Host "Created $Fqdn -> $RecordContent"
}

Write-Host "`nWaiting for DNS propagation (up to 60s)..."
$resolved = $false
for ($i = 0; $i -lt 12; $i++) {
  Start-Sleep -Seconds 5
  try {
    $dns = Resolve-DnsName $Fqdn -Type A -ErrorAction Stop
    if ($dns.IPAddress -contains $RecordContent) {
      $resolved = $true
      Write-Host "DNS resolves: $Fqdn -> $($dns.IPAddress -join ', ')"
      break
    }
  } catch { }
  Write-Host "  ... still waiting ($($i + 1)/12)"
}

if (-not $resolved) {
  Write-Host "DNS not propagated yet - may take 5-15 minutes. Re-run verification later."
}

Write-Host "`nChecking HTTPS..."
curl.exe -sI --max-time 15 "https://$Fqdn/join" | Select-String "HTTP"
curl.exe -sI --max-time 15 "https://$Fqdn/login" | Select-String "HTTP"

Write-Host ""
Write-Host "Next: switch marketing site to custom domain and redeploy."
Write-Host "  Set NEXT_PUBLIC_CROWVO_APP_URL=https://app.crow-vo.com in .env.production and wrangler.jsonc"
Write-Host "  npm run cf:deploy  (from crowvo-website)"
