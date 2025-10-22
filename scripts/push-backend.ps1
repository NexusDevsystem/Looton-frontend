<#
PowerShell script to add a remote and push the `looton/backend` folder to an external GitHub repository.
Usage:
  .\push-backend.ps1 -RemoteUrl "https://github.com/NexusDevsystem/Looton-backend.git" -Branch "main" -TokenEnvVar "GH_TOKEN"

This script creates a temporary git worktree, commits the backend folder contents there (preserving history is non-trivial), and pushes it to the specified remote. It requires:
- Git installed and available in PATH
- A personal access token with repo:push permissions stored in an environment variable (default: GH_TOKEN)

Note: This script performs a one-shot push of the current backend contents. It does not rewrite or preserve original commit history into the target repo. Use with care.
#>
param(
  [Parameter(Mandatory=$true)] [string] $RemoteUrl,
  [string] $Branch = "main",
  [string] $TokenEnvVar = "GH_TOKEN"
)

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Error "git is not installed or not available in PATH."
  exit 1
}

$token = $env:$TokenEnvVar
if (-not $token) {
  Write-Error "Environment variable $TokenEnvVar is not set. Please set it to a GitHub Personal Access Token (repo scope)."
  exit 1
}

# Prepare a temp directory
$tempDir = Join-Path $env:TEMP "looton-backend-push-$(Get-Random)"
New-Item -ItemType Directory -Path $tempDir | Out-Null

try {
  Push-Location $tempDir

  git init -q
  git checkout -b $Branch

  # Copy backend contents
  $source = Join-Path $PSScriptRoot "..\looton\backend"
  if (-not (Test-Path $source)) {
    Write-Error "Source path $source does not exist. Run this script from the repo root where 'looton/backend' exists."
    exit 1
  }

  robocopy $source $tempDir /MIR /XD .git > $null

  git add .
  git commit -m "Deploy backend snapshot" -q

  # Set remote with token
  $authUrl = $RemoteUrl -replace 'https:\/\/','https://'+$token+'@'
  git remote add origin $authUrl
  git push -u origin $Branch -f

  Write-Host "Pushed backend to $RemoteUrl (branch $Branch)"
} finally {
  Pop-Location
  # Clean up
  Remove-Item -Recurse -Force $tempDir
}
