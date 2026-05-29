# Musemint Android app (PWA → TWA)

This folder turns the deployed Musemint PWA into an installable Android app using
a [Trusted Web Activity](https://developer.chrome.com/docs/android/trusted-web-activity/)
(TWA) built with [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap).
A TWA is a thin Android shell that renders the live site full-screen (no browser
URL bar) — so the app always matches production and there is no second codebase.

## What's tracked here

| File | Purpose |
| --- | --- |
| `twa-manifest.json` | The build spec — package id, host, colors, icons, shortcuts. Mirrors `public/manifest.webmanifest`. **Review this.** |
| `build.ps1` | Turnkey build: validates the toolchain, builds the signed APK/AAB, and writes `public/.well-known/assetlinks.json`. |
| `assetlinks.template.json` | Digital Asset Links template; the build fills in the real cert fingerprint. |
| `.gitignore` | Keeps secrets (keystore), binaries (`*.apk`/`*.aab`), and the generated Android project out of git. |

Everything Bubblewrap generates (the `app/` Gradle project, the keystore, the
APK/AAB) is intentionally **not** committed.

## Prerequisites (one-time)

1. **Bubblewrap CLI** — `npm i -g @bubblewrap/cli` (this repo was scaffolded with 1.24.x).
2. **JDK 17** — Bubblewrap rejects any other version. The JDK bundled with Android
   Studio (JBR) is 21 and will **not** work. Download *OpenJDK 17 (LTS)*:
   <https://adoptium.net/temurin/releases/?version=17&package=jdk>
3. **Android SDK** with build-tools — installed by Android Studio (SDK Manager).
   Default location `%LOCALAPPDATA%\Android\Sdk`.

## Build

```powershell
# from android-twa\
.\build.ps1 -JdkPath "C:\path\to\jdk-17"
```

On the **first** run Bubblewrap prompts you to create a signing keystore and set
its passwords. Save those passwords — the **same keystore must sign every future
update**, or Google Play will reject the upload. The keystore
(`android-keystore.jks`) stays local and is gitignored.

Outputs:
- `app-release-signed.apk` — sideload/test build (`adb install -r app-release-signed.apk`)
- `app-release-bundle.aab` — Play Store upload format
- `../public/.well-known/assetlinks.json` — generated from your cert fingerprint

## After building: make the URL bar disappear

The app launches full-screen only once the Digital Asset Links file is live and
matches the signing cert:

1. Commit & deploy so this resolves:
   `https://recallos-vaibhav4046s-projects.vercel.app/.well-known/assetlinks.json`
2. If you use **Play App Signing**, also add Google's signing fingerprint
   (from the Play Console) to `assetlinks.json` and redeploy.

## Why no APK is committed

A real signed APK requires a JDK 17 download, a local signing keystore (with
secret passwords), and a deploy of `assetlinks.json` — all of which are
performed by **you** running `build.ps1`. The binary is a build artifact, not
source, so it is gitignored.
