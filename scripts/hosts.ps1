# Manage GHOSTNET dev hostnames in the Windows hosts file.
# Self-elevates via UAC for install / remove (status is read-only).
#
# Source-of-truth: dev/caddy/hosts.local
#
# Usage (from any PowerShell):
#   .\scripts\hosts.ps1 install
#   .\scripts\hosts.ps1 remove
#   .\scripts\hosts.ps1 status

#Requires -Version 5.1
[CmdletBinding()]
param(
  [Parameter(Position = 0)]
  [ValidateSet('install', 'remove', 'status')]
  [string]$Command = 'status'
)

$ErrorActionPreference = 'Stop'

# Resolve repo paths.
$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot    = Split-Path -Parent $ScriptDir
$HostsLocal  = Join-Path $RepoRoot 'dev/caddy/hosts.local'
$HostsFile   = Join-Path $env:WINDIR 'System32\drivers\etc\hosts'

$StartMarker = '# === GHOSTNET HOSTS START ==='
$EndMarker   = '# === GHOSTNET HOSTS END ==='

function Write-Info  { param($m) Write-Host "[hosts] $m" -ForegroundColor Cyan }
function Write-Warn2 { param($m) Write-Host "[hosts] $m" -ForegroundColor Yellow }
function Write-ErrX  { param($m) Write-Host "[hosts] $m" -ForegroundColor Red; exit 1 }

# ── Pre-flight ───────────────────────────────────────────────────
if (-not (Test-Path $HostsLocal)) { Write-ErrX "Source hosts file missing: $HostsLocal" }
if (-not (Test-Path $HostsFile))  { Write-ErrX "System hosts file missing: $HostsFile" }

# ── Self-elevate for install / remove ────────────────────────────
function Test-Admin {
  $id = [Security.Principal.WindowsIdentity]::GetCurrent()
  $p  = New-Object Security.Principal.WindowsPrincipal($id)
  $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (($Command -ne 'status') -and -not (Test-Admin)) {
  Write-Info "Re-launching elevated to write $HostsFile..."
  $args = "-NoProfile -ExecutionPolicy Bypass -File `"$($MyInvocation.MyCommand.Path)`" $Command"
  Start-Process powershell -Verb RunAs -ArgumentList $args -Wait
  exit
}

# ── Helpers ──────────────────────────────────────────────────────
function Read-HostsLocalEntries {
  Get-Content $HostsLocal | Where-Object { $_ -match '^\s*[^#\s]' }
}

function Strip-Block {
  $content = Get-Content $HostsFile
  $output  = New-Object System.Collections.Generic.List[string]
  $skip    = $false
  foreach ($line in $content) {
    if ($line -eq $StartMarker) { $skip = $true; continue }
    if ($line -eq $EndMarker)   { $skip = $false; continue }
    if (-not $skip) { $output.Add($line) }
  }
  Set-Content -Path $HostsFile -Value $output -Encoding ASCII
}

function Install-Block {
  Strip-Block
  $entries = Read-HostsLocalEntries
  $block   = @($StartMarker) + $entries + @($EndMarker)
  Add-Content -Path $HostsFile -Value $block -Encoding ASCII
  Write-Info "Done. Installed $($entries.Count) hostname(s)."
}

function Remove-Block {
  $existing = Get-Content $HostsFile
  if ($existing -notcontains $StartMarker) {
    Write-Info "No GHOSTNET block found — nothing to remove."
    return
  }
  Strip-Block
  Write-Info "Done."
}

function Show-Status {
  $existing = Get-Content $HostsFile
  if ($existing -contains $StartMarker) {
    Write-Info "GHOSTNET hosts block IS installed in $HostsFile :"
    $inBlock = $false
    foreach ($line in $existing) {
      if ($line -eq $StartMarker) { $inBlock = $true }
      if ($inBlock) { Write-Host "  $line" }
      if ($line -eq $EndMarker)   { $inBlock = $false }
    }
  } else {
    Write-Info "GHOSTNET hosts block is NOT installed in $HostsFile."
    Write-Info "Source-of-truth (would be added):"
    Read-HostsLocalEntries | ForEach-Object { Write-Host "  $_" }
  }
}

# ── Dispatch ─────────────────────────────────────────────────────
switch ($Command) {
  'install' { Write-Info "Installing GHOSTNET hosts block into $HostsFile..."; Install-Block }
  'remove'  { Write-Info "Removing GHOSTNET hosts block from $HostsFile..."; Remove-Block }
  'status'  { Show-Status }
}
