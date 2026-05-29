// bw-build.js — drive Bubblewrap's build() non-interactively (no TTY prompts).
//
// Bubblewrap's CLI `build` is interactive: on first run it prompts to
// (re)generate the Android project and for a new versionName. Over a non-TTY
// stdin (CI / scripted), inquirer cannot read those prompts — it either
// EOF-crashes between prompts (ERR_USE_AFTER_CLOSE) or render-storms an input
// prompt. Bubblewrap's build() accepts an injectable Prompt, so we pass a stub
// that auto-answers and reads the signing passwords from the environment
// (BUBBLEWRAP_KEYSTORE_PASSWORD / BUBBLEWRAP_KEY_PASSWORD) — exactly the path
// the real flow takes when those env vars are set.
//
// Requires NODE_PATH to point at the global node_modules so the
// globally-installed @bubblewrap/cli + @bubblewrap/core resolve. build.ps1
// sets that from `npm root -g` before invoking this script.
'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');

let cliBuild, cliConfig, core;
try {
  cliBuild = require('@bubblewrap/cli/dist/lib/cmds/build');
  cliConfig = require('@bubblewrap/cli/dist/lib/config');
  // @bubblewrap/core may be deduped to the top-level global node_modules, or
  // nested under @bubblewrap/cli/node_modules (npm's choice). Try the normal
  // resolution first; if that fails, resolve it from the cli package's own
  // node_modules so it works regardless of the installed layout.
  try {
    core = require('@bubblewrap/core');
  } catch (_) {
    const cliPkgDir = path.dirname(require.resolve('@bubblewrap/cli/package.json'));
    core = require(path.join(cliPkgDir, 'node_modules', '@bubblewrap', 'core'));
  }
} catch (e) {
  console.error('Could not load @bubblewrap modules. Set NODE_PATH to the output of `npm root -g`.');
  console.error(e && e.message ? e.message : e);
  process.exit(3);
}

function manifestVersionName(cwd) {
  try {
    const m = JSON.parse(fs.readFileSync(path.join(cwd, 'twa-manifest.json'), 'utf8'));
    if (m && typeof m.appVersionName === 'string' && m.appVersionName.length > 0) {
      return m.appVersionName;
    }
  } catch (_) {
    /* fall through to default */
  }
  return '1.0.0';
}

// Resolve the JDK's bin directory (where jarsigner.exe / keytool.exe live).
// Bubblewrap signs the AAB by invoking the bare command name `jarsigner`
// (core/jdk/JarSigner.js) and resolves it via PATH. The JDK bin is NOT on the
// system PATH here, so that lookup fails ("'jarsigner' is not recognized")
// unless we add it. build.ps1 writes ~/.bubblewrap/config.json with jdkPath
// before launching this script; read it from there, falling back to JAVA_HOME.
function jdkBinDir() {
  try {
    const cfgPath = path.join(os.homedir(), '.bubblewrap', 'config.json');
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    if (cfg && typeof cfg.jdkPath === 'string' && cfg.jdkPath.length > 0) {
      return path.join(cfg.jdkPath, 'bin');
    }
  } catch (_) {
    /* fall through to JAVA_HOME */
  }
  if (process.env.JAVA_HOME) return path.join(process.env.JAVA_HOME, 'bin');
  return null;
}

(async () => {
  // bw-build.js lives in the android-twa project root. Force the process CWD to
  // that directory before building: Bubblewrap's GradleWrapper invokes
  // `gradlew.bat`/`./gradlew` from process.cwd() (build.js constructs it without
  // a projectLocation, so it ignores args.directory). The wrapper only resolves
  // if CWD is the generated project root. Deriving CWD from __dirname makes this
  // independent of how the script was launched — PowerShell's Set-Location does
  // not reliably propagate to a child process's working directory, which is what
  // caused "'gradlew.bat' is not recognized" on the first attempt.
  process.chdir(__dirname);
  const cwd = __dirname;

  // Bubblewrap's GradleWrapper runs the bare command name `gradlew.bat` (Windows)
  // through cmd.exe via execFile+shell:true. cmd only searches the *current
  // directory* for that command when `NoDefaultCurrentDirectoryInExePath` is
  // unset — and many environments set it (this one does, value "1"), so cmd
  // reports "'gradlew.bat' is not recognized" even though CWD is the project
  // root. Make wrapper resolution independent of that policy: clear the policy
  // var and put the project root on PATH for the child. Bubblewrap copies
  // process.env into the env it hands to gradle, so both changes propagate.
  // (CWD is still the project root, so Gradle resolves settings.gradle correctly.)
  delete process.env.NoDefaultCurrentDirectoryInExePath;
  // Prepend, in order: the JDK bin (so the bare `jarsigner` command Bubblewrap
  // runs to sign the AAB resolves) and the project root (so the bare
  // `gradlew.bat` command resolves). Assigning to process.env.Path goes through
  // Node's case-insensitive Windows env proxy, so it updates the real PATH key
  // that cmd.exe reads — both bare-command lookups then succeed. Bubblewrap
  // copies process.env into each child's env (JdkHelper.getEnv), so this
  // propagates to gradle, jarsigner, and apksigner alike.
  const pathPrefix = [];
  const jdkBin = jdkBinDir();
  if (jdkBin) pathPrefix.push(jdkBin);
  pathPrefix.push(__dirname);
  process.env.Path = pathPrefix.join(path.delimiter) + path.delimiter +
    (process.env.Path || process.env.PATH || '');

  const log = new core.ConsoleLog('build');
  console.log('[bw-build] cwd=' + process.cwd());
  const versionName = process.env.BW_VERSION_NAME || manifestVersionName(cwd);

  // Non-interactive Prompt stub matching @bubblewrap/cli's InquirerPrompt API.
  const prompt = {
    printMessage: (m) => console.log(typeof m === 'string' ? m : String(m)),
    // "Regenerate project?" and similar confirms: take the provided default
    // (true for the regenerate prompt).
    promptConfirm: async (_message, defaultValue) =>
      defaultValue === undefined ? true : defaultValue,
    // versionName (and any input): use the offered default, else the manifest
    // versionName. Validators only require a non-empty string.
    promptInput: async (_message, defaultValue) =>
      defaultValue !== null && defaultValue !== undefined && defaultValue !== ''
        ? defaultValue
        : versionName,
    promptChoice: async (_message, _choices, defaultValue) => defaultValue,
    // Signing passwords come from env vars; this is a safety net only.
    promptPassword: async () => process.env.BUBBLEWRAP_KEYSTORE_PASSWORD || '',
  };

  // Load ~/.bubblewrap/config.json the same way the CLI does (build.ps1 wrote it).
  const config = await cliConfig.loadOrCreateConfig(log, prompt);
  const args = {
    manifest: path.join(cwd, 'twa-manifest.json'),
    directory: cwd,
    skipSigning: false,
  };

  const ok = await cliBuild.build(config, args, log, prompt);
  console.log('BUILD_RESULT=' + ok);
  process.exit(ok ? 0 : 1);
})().catch((e) => {
  console.error('BUILD_ERROR:', e && e.stack ? e.stack : e);
  process.exit(2);
});
