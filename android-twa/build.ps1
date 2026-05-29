<#
.SYNOPSIS
  Turnkey Android APK/AAB build for Musemint (PWA -> Trusted Web Activity via Bubblewrap).

.DESCRIPTION
  Wraps the full Bubblewrap flow into one reviewable script:
    1. Validates prerequisites (Bubblewrap CLI, JDK 17, Android SDK).
    2. Points Bubblewrap at the supplied JDK 17 + Android SDK.
    3. Builds the signed APK + AAB from twa-manifest.json (next to this script).
    4. Extracts the signing-cert SHA-256 fingerprint and writes
       ../public/.well-known/assetlinks.json from assetlinks.template.json,
       so the installed app launches without a browser URL bar.

  Bubblewrap rejects JDK versions other than 17 (the bundled Android Studio JBR
  is 21 and will NOT work). Download "OpenJDK 17 (LTS)" from
  https://adoptium.net/temurin/releases/?version=17&package=jdk and pass its
  path with -JdkPath.

  This script is INTERACTIVE on first run: Bubblewrap prompts you to create a
  signing keystore and asks for its passwords. Keep those passwords safe — the
  same keystore must sign every future update or the Play Store will reject it.

.PARAMETER JdkPath
  Path to a JDK 17 install (the folder that contains bin\java.exe).

.PARAMETER AndroidSdkPath
  Path to the Android SDK (the folder that contains the "build-tools" folder).
  Defaults to %LOCALAPPDATA%\Android\Sdk.

.PARAMETER SkipDoctor
  Skip "bubblewrap doctor" (the build runs it implicitly anyway).

.EXAMPLE
  .\build.ps1 -JdkPath "C:\Java\jdk-17.0.12"
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$JdkPath,

  [string]$AndroidSdkPath = (Join-Path $env:LOCALAPPDATA "Android\Sdk"),

  [string]$KeystorePassword,

  [switch]$SkipDoctor
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot  = Split-Path -Parent $scriptDir
Set-Location $scriptDir

function Fail($msg) { Write-Host "`n[BUILD FAILED] $msg" -ForegroundColor Red; exit 1 }
function Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }

# PowerShell 5.1 `Out-File -Encoding utf8` writes a UTF-8 BOM, which breaks
# Bubblewrap's config parser and JSON consumers. Write BOM-free instead.
function Write-Utf8NoBom([string]$Path, [string]$Content) {
  [System.IO.File]::WriteAllText($Path, $Content, (New-Object System.Text.UTF8Encoding($false)))
}

# Run a native exe and capture combined stdout+stderr as one string. Avoids the
# PowerShell 5.1 trap where `2>&1` on a native command, under
# $ErrorActionPreference='Stop', turns stderr lines into a terminating
# NativeCommandError. Tools like `java -version` and `keytool` print to stderr.
function Invoke-Native([string]$Exe, [string[]]$ArgList) {
  $prev = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    $lines = & $Exe @ArgList 2>&1 | ForEach-Object {
      if ($_ -is [System.Management.Automation.ErrorRecord]) { $_.Exception.Message } else { $_.ToString() }
    }
  } finally {
    $ErrorActionPreference = $prev
  }
  return ($lines -join "`n")
}

# --- 1. Prerequisites ------------------------------------------------------
Step "Checking prerequisites"

if (-not (Get-Command bubblewrap -ErrorAction SilentlyContinue)) {
  Fail "Bubblewrap CLI not found. Install it: npm i -g @bubblewrap/cli"
}

$javaExe = Join-Path $JdkPath "bin\java.exe"
if (-not (Test-Path $javaExe)) { Fail "No java.exe under -JdkPath '$JdkPath'. Point it at a JDK 17 root." }

# Verify it really is major version 17 (Bubblewrap refuses anything else).
$verText = Invoke-Native $javaExe @('-version')
if ($verText -notmatch 'version "17') {
  Fail "JDK at '$JdkPath' is not version 17.`n$verText"
}
Write-Host "JDK 17 OK: $JdkPath"

$keytoolExe = Join-Path $JdkPath "bin\keytool.exe"
if (-not (Test-Path $keytoolExe)) { Fail "keytool.exe not found under JDK bin." }

if (-not (Test-Path (Join-Path $AndroidSdkPath "build-tools"))) {
  Fail "Android SDK at '$AndroidSdkPath' has no 'build-tools' folder. Install it via Android Studio > SDK Manager, or pass -AndroidSdkPath."
}
Write-Host "Android SDK OK: $AndroidSdkPath"

# Bubblewrap's AndroidSdkTools.validatePath insists on a `tools` (or `bin`)
# folder under the SDK root -- a stale check vs the modern cmdline-tools layout.
# An empty `tools` dir satisfies it without touching the real toolchain.
$sdkToolsDir = Join-Path $AndroidSdkPath "tools"
if (-not (Test-Path $sdkToolsDir)) { New-Item -ItemType Directory -Path $sdkToolsDir | Out-Null }

$manifest = Join-Path $scriptDir "twa-manifest.json"
if (-not (Test-Path $manifest)) { Fail "twa-manifest.json missing next to this script." }

# --- 2. Point Bubblewrap at the right toolchain ---------------------------
Step "Configuring Bubblewrap toolchain"
$bwConfigDir = Join-Path $env:USERPROFILE ".bubblewrap"
if (-not (Test-Path $bwConfigDir)) { New-Item -ItemType Directory -Path $bwConfigDir | Out-Null }
$bwConfig = Join-Path $bwConfigDir "config.json"
$bwJson = @{ jdkPath = $JdkPath; androidSdkPath = $AndroidSdkPath } | ConvertTo-Json -Compress
Write-Utf8NoBom $bwConfig $bwJson
Write-Host "Wrote $bwConfig"

# --- 2b. Signing keystore --------------------------------------------------
Step "Ensuring signing keystore"
$keystorePath = Join-Path $scriptDir "android-keystore.jks"
$credsPath    = Join-Path $scriptDir "keystore-credentials.txt"
if (-not (Test-Path $keystorePath)) {
  if (-not $KeystorePassword) {
    # Generate a strong random password (url-safe base64, no padding).
    $rndBytes = New-Object byte[] 18
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($rndBytes)
    $KeystorePassword = [Convert]::ToBase64String($rndBytes).Replace('+','-').Replace('/','_').TrimEnd('=')
  }
  Write-Host "Creating signing keystore (alias 'musemint')..."
  $null = Invoke-Native $keytoolExe @('-genkeypair','-v','-keystore',$keystorePath,'-alias','musemint',
    '-keyalg','RSA','-keysize','2048','-validity','10000',
    '-storepass',$KeystorePassword,'-keypass',$KeystorePassword,
    '-dname','CN=Musemint, OU=Musemint, O=Musemint, C=US')
  if ($LASTEXITCODE -ne 0) { Fail "keytool failed to create the keystore." }
  if (-not (Test-Path $keystorePath)) { Fail "keytool reported success but no keystore at $keystorePath." }
  $creds = @"
MUSEMINT ANDROID SIGNING KEYSTORE -- keep safe, keep OUT of git.
The SAME keystore must sign every Play Store update, or uploads are rejected.
keystore : $keystorePath
alias    : musemint
storepass: $KeystorePassword
keypass  : $KeystorePassword
"@
  Write-Utf8NoBom $credsPath $creds
  Write-Host "Keystore created. Password saved to keystore-credentials.txt (gitignored) -- BACK IT UP." -ForegroundColor Yellow
} else {
  if (-not $KeystorePassword) {
    Fail "Keystore exists but no -KeystorePassword supplied. Re-run with -KeystorePassword '<pw>' (see keystore-credentials.txt)."
  }
  Write-Host "Using existing keystore: $keystorePath"
}
$env:BUBBLEWRAP_KEYSTORE_PASSWORD = $KeystorePassword
$env:BUBBLEWRAP_KEY_PASSWORD      = $KeystorePassword

# --- 3. Doctor -------------------------------------------------------------
if (-not $SkipDoctor) {
  Step "Running bubblewrap doctor"
  & bubblewrap doctor
  if ($LASTEXITCODE -ne 0) { Fail "bubblewrap doctor reported problems (see above)." }
}

# --- 4. Build --------------------------------------------------------------
# Bubblewrap's `build` CLI is interactive (regenerate-project + versionName
# prompts) and cannot be driven over a non-TTY stdin without crashing
# (ERR_USE_AFTER_CLOSE) or render-storming. Instead we call Bubblewrap's
# exported build() through bw-build.js with a non-interactive Prompt stub.
# That needs the global node_modules on NODE_PATH so the globally-installed
# @bubblewrap packages resolve.
Step "Building APK + AAB (non-interactive)"
$globalModules = (& npm root -g | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or -not $globalModules) { Fail "Could not resolve global npm modules (npm root -g)." }
$env:NODE_PATH = $globalModules
& node (Join-Path $scriptDir "bw-build.js")
if ($LASTEXITCODE -ne 0) { Fail "Android build failed (see bw-build.js output above)." }

$apk = Join-Path $scriptDir "app-release-signed.apk"
$aab = Join-Path $scriptDir "app-release-bundle.aab"
if (Test-Path $apk) { Write-Host "APK: $apk" -ForegroundColor Green }
if (Test-Path $aab) { Write-Host "AAB: $aab" -ForegroundColor Green }

# --- 5. Digital Asset Links ------------------------------------------------
Step "Generating .well-known/assetlinks.json"
$keystore = Join-Path $scriptDir "android-keystore.jks"
if (-not (Test-Path $keystore)) {
  Write-Host "No keystore at $keystore - skipping assetlinks. Re-run after the build creates it." -ForegroundColor Yellow
} else {
  Write-Host "Reading SHA-256 fingerprint from the signing keystore..."
  $listing = Invoke-Native $keytoolExe @('-list','-v','-keystore',$keystore,'-alias','musemint','-storepass',$env:BUBBLEWRAP_KEYSTORE_PASSWORD)
  $m = [regex]::Match($listing, 'SHA256:\s*([0-9A-Fa-f:]{95})')
  if (-not $m.Success) {
    Write-Host "Could not parse SHA-256 fingerprint. Run manually:" -ForegroundColor Yellow
    Write-Host "  bubblewrap fingerprint generateAssetLinks" -ForegroundColor Yellow
  } else {
    $fingerprint = $m.Groups[1].Value.ToUpper()
    Write-Host "Fingerprint: $fingerprint"
    $template = Get-Content (Join-Path $scriptDir "assetlinks.template.json") -Raw
    $out = $template.Replace("REPLACE_WITH_SHA256_FINGERPRINT_OF_YOUR_SIGNING_KEY", $fingerprint)
    $wellKnown = Join-Path $repoRoot "public\.well-known"
    if (-not (Test-Path $wellKnown)) { New-Item -ItemType Directory -Path $wellKnown | Out-Null }
    Write-Utf8NoBom (Join-Path $wellKnown "assetlinks.json") $out
    Write-Host "Wrote public\.well-known\assetlinks.json" -ForegroundColor Green
  }
}

# --- Done ------------------------------------------------------------------
Step "Next steps"
Write-Host @"
1. Commit + deploy so https://recallos-vaibhav4046s-projects.vercel.app/.well-known/assetlinks.json is live.
   (Required for the app to launch full-screen without a URL bar.)
2. Install the APK on a device for testing:
     adb install -r android-twa\app-release-signed.apk
3. For the Play Store, upload app-release-bundle.aab. If you opt into Play App
   Signing, add Google's signing fingerprint to assetlinks.json too, then redeploy.
"@ -ForegroundColor Green
