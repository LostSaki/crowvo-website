param(
  [ValidateSet("dev", "prod")]
  [string]$Mode = "dev",

  [switch]$Down
)

$ErrorActionPreference = "Stop"

function Write-Info($message) {
  Write-Host "[hubly-docker] $message" -ForegroundColor Cyan
}

function Ensure-DockerAvailable {
  $dockerVersionOutput = & docker version 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Docker is not available. Start Docker Desktop first, then re-run this script. Details: $dockerVersionOutput"
  }
}

function Ensure-EnvFile {
  if (-not (Test-Path ".env")) {
    Write-Info "No .env found. Creating from .env.example..."
    Copy-Item ".env.example" ".env"
  }

  $envContent = Get-Content ".env" -Raw
  $desiredDb = 'DATABASE_URL="postgresql://postgres:postgres@db:5432/hubly"'
  if ($envContent -match '^DATABASE_URL=.*' -or $envContent -match '(?m)^DATABASE_URL=.*') {
    $updated = [System.Text.RegularExpressions.Regex]::Replace($envContent, '(?m)^DATABASE_URL=.*$', $desiredDb)
    Set-Content ".env" $updated
  } else {
    Add-Content ".env" "`r`n$desiredDb"
  }
}

Ensure-DockerAvailable

if ($Down) {
  Write-Info "Stopping Docker services..."
  docker compose down
  exit $LASTEXITCODE
}

Ensure-EnvFile

if ($Mode -eq "prod") {
  Write-Info "Starting production profile (web-prod + db) ..."
  docker compose --profile prod up --build web-prod db
} else {
  Write-Info "Starting development profile (web + db) ..."
  docker compose up --build
}
