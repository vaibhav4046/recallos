<#
  Save one item to Musemint memory from PowerShell (Windows laptop).
  No API key needed on the single-user instance.

  Usage:
    .\capture.ps1 -Kind url   -Url "https://youtu.be/xyz" -Title "optional"
    .\capture.ps1 -Kind note  -Title "idea" -Body "body text..."
    .\capture.ps1 -Kind linkedin -Url "https://..." -Body "pasted post"

  Base URL: $env:MUSEMINT_BASE_URL, else config.json baseUrl, else default.
#>
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('url','note','prompt','youtube','linkedin','instagram','github','article','text')]
  [string]$Kind,
  [string]$Url = '',
  [string]$Title = '',
  [string]$Body = '',
  [string]$Intent = 'auto'
)

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$base = $env:MUSEMINT_BASE_URL
if ([string]::IsNullOrWhiteSpace($base)) {
  $cfg = Join-Path $here 'config.json'
  if (Test-Path $cfg) { $base = (Get-Content $cfg -Raw | ConvertFrom-Json).baseUrl }
}
if ([string]::IsNullOrWhiteSpace($base)) { $base = 'https://recallos-vaibhav4046s-projects.vercel.app' }
$base = $base.TrimEnd('/')

$payload = @{ kind = $Kind; intent = $Intent }
if ($Url)   { $payload.url = $Url }
if ($Title) { $payload.title = $Title }
if ($Body)  { $payload.rawContent = $Body }

$json = $payload | ConvertTo-Json -Compress
Invoke-RestMethod -Method Post -Uri "$base/api/capture" -ContentType 'application/json' -Body $json |
  ConvertTo-Json -Depth 6
