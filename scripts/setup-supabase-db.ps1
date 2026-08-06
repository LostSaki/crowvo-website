# Configures Supabase Postgres for local Next (.env.local).
# Usage:
#   1. Supabase Dashboard → Project → Connect → ORM / Prisma → copy the **Transaction pooler** URI (port 6543, pgbouncer=true)
#   2. Either copy it to clipboard, or save in .env.supabase as:  DATABASE_URL="postgresql://..."
#   3. Run:  npm run setup:db
#   4. To also push schema / update Cloudflare secrets, run this script with -ApplyRemoteChanges
# Optional: SUPABASE_DB_PASSWORD in .env.supabase (script builds pooler + direct URLs for project tcocyipczygfhgxapwit)

param(
  [string]$ProjectRef = "tcocyipczygfhgxapwit",
  [switch]$ApplyRemoteChanges,
  [switch]$SkipWrangler,
  [switch]$SkipPrismaPush
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Read-DotEnvFile([string]$path) {
  $vars = @{}
  if (-not (Test-Path $path)) { return $vars }
  Get-Content $path | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
    $name, $value = $_ -split '=', 2
    $name = $name.Trim()
    $value = $value.Trim().Trim('"').Trim("'")
    if ($name) { $vars[$name] = $value }
  }
  return $vars
}

$script:LastDbTestError = ""

function Test-DatabaseUrl([string]$url) {
  $env:DATABASE_URL = $url
  $prev = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  $output = echo "SELECT 1 AS ok" | npx prisma db execute --url $url --stdin 2>&1 | Out-String
  $script:LastDbTestError = $output
  $ok = $LASTEXITCODE -eq 0
  $ErrorActionPreference = $prev
  return $ok
}

function Build-UrlsFromPassword([string]$password, [string]$ref) {
  $enc = [uri]::EscapeDataString($password)
  # Supabase transaction pooler (serverless): same host as direct, port 6543
  $transactionPooler = "postgresql://postgres:${enc}@db.${ref}.supabase.co:6543/postgres?pgbouncer=true&sslmode=require"
  $direct = @(
    $transactionPooler,
    "postgresql://postgres:${enc}@db.${ref}.supabase.co:5432/postgres?sslmode=require",
    "postgresql://postgres.${ref}:${enc}@db.${ref}.supabase.co:5432/postgres?sslmode=require"
  )
  $regions = @(
    "us-east-1", "us-west-1", "us-west-2",
    "eu-west-1", "eu-west-2", "eu-central-1",
    "ap-southeast-1", "ap-southeast-2", "ap-northeast-1", "ap-northeast-2",
    "sa-east-1", "ca-central-1"
  )
  $candidates = [System.Collections.Generic.List[string]]::new()
  foreach ($d in $direct) { $candidates.Add($d) }
  foreach ($region in $regions) {
    $candidates.Add("postgresql://postgres.${ref}:${enc}@aws-0-${region}.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require")
    $candidates.Add("postgresql://postgres.${ref}:${enc}@aws-0-${region}.pooler.supabase.com:5432/postgres?sslmode=require")
    $candidates.Add("postgresql://postgres:${enc}@aws-0-${region}.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require")
  }
  return $candidates
}

# Resolve DATABASE_URL
$databaseUrl = $null
$supabaseEnv = Read-DotEnvFile (Join-Path $root ".env.supabase")
if ($supabaseEnv["DATABASE_URL"]) {
  $databaseUrl = $supabaseEnv["DATABASE_URL"]
  if ($databaseUrl -match '^https?://' -and $databaseUrl -notmatch '^postgres') {
    Write-Host @"

DATABASE_URL in .env.supabase looks like the Supabase project URL (https://...supabase.co),
not a Postgres connection string.

In the dashboard, open Connect -> ORM / Prisma -> Transaction mode and copy the URI that
starts with:  postgresql://postgres:...

https://supabase.com/dashboard/project/$ProjectRef?showConnect=true&method=transaction

"@
    exit 1
  }
}

if (-not $databaseUrl) {
  $clip = (Get-Clipboard -Raw -ErrorAction SilentlyContinue)
  if ($clip -and $clip -match 'postgres(ql)?://[^\s]+supabase') {
    $databaseUrl = $clip.Trim().Trim('"')
    Write-Host "Using Supabase connection string from clipboard."
  }
}

if (-not $databaseUrl -and $supabaseEnv.ContainsKey("SUPABASE_DB_PASSWORD")) {
  if (-not $supabaseEnv["SUPABASE_DB_PASSWORD"]) {
    Write-Host "SUPABASE_DB_PASSWORD is empty in .env.supabase - save the file in your editor, then re-run."
    exit 1
  }
  Write-Host "Probing Supabase pooler regions (password from .env.supabase)..."
  foreach ($candidate in (Build-UrlsFromPassword $supabaseEnv["SUPABASE_DB_PASSWORD"] $ProjectRef)) {
    Write-Host "  Trying $($candidate -replace ':[^:@]+@', ':***@')..."
    if (Test-DatabaseUrl $candidate) {
      $databaseUrl = $candidate
      Write-Host "  Connected."
      break
    }
  }
}

if (-not $databaseUrl) {
  $authHint = ""
  if ($script:LastDbTestError -match "P1000|SASL authentication failed|Password authentication failed") {
    $authHint = @"

The database host was reached, but the password was rejected (SASL / P1000).
Reset the database password in Supabase, then update .env.supabase:
  https://supabase.com/dashboard/project/$ProjectRef/database/settings

"@
  }
  Write-Host @"

Could not resolve DATABASE_URL.
$authHint
Pick ONE of the following, then re-run:  npm run setup:db

  A) Recommended - paste the full URI from Supabase Connect (Transaction mode):
       https://supabase.com/dashboard/project/$ProjectRef?showConnect=true&method=transaction
       Save in .env.supabase as:  DATABASE_URL="postgresql://postgres:...@db.$ProjectRef.supabase.co:6543/postgres..."

  B) Or set only the database password (must match Settings - Database exactly):
       SUPABASE_DB_PASSWORD="..."

  C) Copy that URI to your clipboard and run this script again.

"@
  exit 1
}

if ($databaseUrl -notmatch 'supabase\.(co|com)') {
  Write-Warning "DATABASE_URL does not look like Supabase; continuing anyway."
}

# Prefer transaction pooler for Workers if we only have direct
if ($databaseUrl -match '@db\.' -and $supabaseEnv["SUPABASE_DB_PASSWORD"]) {
  foreach ($candidate in (Build-UrlsFromPassword $supabaseEnv["SUPABASE_DB_PASSWORD"] $ProjectRef)) {
    if ($candidate -match ':6543/' -and (Test-DatabaseUrl $candidate)) {
      $databaseUrl = $candidate
      Write-Host "Upgraded to transaction pooler URL for serverless."
      break
    }
  }
}

# Write .env.local (overrides Docker DATABASE_URL in .env)
$localPath = Join-Path $root ".env.local"
$localLines = @(
  "# Auto-generated by scripts/setup-supabase-db.ps1 - do not commit",
  "DATABASE_URL=`"$databaseUrl`""
)
if ($supabaseEnv["DIRECT_URL"]) {
  $localLines += "DIRECT_URL=`"$($supabaseEnv['DIRECT_URL'])`""
}
Set-Content -Path $localPath -Value ($localLines -join "`n") -Encoding utf8
Write-Host "Wrote $localPath"

# Persist for re-runs (password stripped from file when using full URL)
$supabaseOut = Join-Path $root ".env.supabase"
if (-not (Test-Path $supabaseOut)) {
  Set-Content -Path $supabaseOut -Value "# DATABASE_URL saved by setup script`nDATABASE_URL=`"$databaseUrl`"" -Encoding utf8
}

if (-not $ApplyRemoteChanges) {
  Write-Host "Remote mutation steps skipped. Re-run with -ApplyRemoteChanges to run prisma db push and wrangler secret put."
}

if ($ApplyRemoteChanges -and -not $SkipPrismaPush) {
  Write-Host "Running prisma db push..."
  npx dotenv -e .env.local -- prisma db push
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "prisma db push failed (wrong password or tables already exist). Check .env.local credentials."
  }
}

if ($ApplyRemoteChanges -and -not $SkipWrangler) {
  Write-Host "Updating Cloudflare Worker secrets (DATABASE_URL, DIRECT_URL)..."
  $databaseUrl | npx wrangler secret put DATABASE_URL
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "wrangler secret put DATABASE_URL failed."
  }
  $directSecret = if ($supabaseEnv["DIRECT_URL"]) { $supabaseEnv["DIRECT_URL"] } else { $databaseUrl }
  $directSecret | npx wrangler secret put DIRECT_URL
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "wrangler secret put DIRECT_URL failed."
  } else {
    Write-Host "Cloudflare secrets updated. Redeploy with: npm run cf:deploy"
  }
}

Write-Host "Done. Restart dev server (npm run dev) or redeploy Workers."
