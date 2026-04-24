import fs from "node:fs";
import path from "node:path";

const targetFile = path.join(
  process.cwd(),
  "node_modules",
  "@opennextjs",
  "cloudflare",
  "dist",
  "cli",
  "index.mjs"
);
const nextPackageFile = path.join(process.cwd(), "node_modules", "next", "package.json");
const patchedMarker = "CacheHandler = OpenNextCacheHandler;";
const badAwaitImportMarker =
  "CacheHandler = (await import('./\" + cacheHandlerFileBase + \".mjs')).OpenNextCacheHandler;";
const legacyDynamicRequireMarker =
  "CacheHandler = dynamicRequire((0, _path.join)(this.distDir, incrementalCacheHandlerPath));";
const verifyOnly = process.argv.includes("--verify");
const supportedNextVersion = "13.5.11";

const oldCachePattern = /const \{ cacheHandler \} = this\.nextConfig;/;
const incrementalCachePattern =
  /const \{ incrementalCacheHandlerPath \} = this\.nextConfig\.experimental;\s+if \(incrementalCacheHandlerPath\) \{\s+CacheHandler = dynamicRequire\(\(0, _path\.isAbsolute\)\(incrementalCacheHandlerPath\) \? incrementalCacheHandlerPath : \(0, _path\.join\)\(this\.distDir, incrementalCacheHandlerPath\)\);\s+CacheHandler = CacheHandler\.default \|\| CacheHandler;\s+\}/;
const patchCacheFunctionPattern = /async function patchCache\(code, config\) \{[\s\S]*?return patchedCode;\r?\n\}/;

const patchedFunction = `async function patchCache(code, config) {
  console.log("# patchCache");
  const cacheHandlerFileBase = "cache-handler";
  const cacheHandlerEntrypoint = join8(config.paths.internalTemplates, "cache-handler", "index.ts");
  const cacheHandlerEsmOutputFile = join8(config.paths.outputDir, cacheHandlerFileBase + ".mjs");
  const cacheHandlerCjsOutputFile = join8(config.paths.outputDir, cacheHandlerFileBase + ".cjs");
  const define = {
    "process.env.__OPENNEXT_KV_BINDING_NAME": "\\"" + config.cache.kvBindingName + "\\""
  };
  await build({
    entryPoints: [cacheHandlerEntrypoint],
    bundle: true,
    outfile: cacheHandlerEsmOutputFile,
    format: "esm",
    target: "esnext",
    minify: config.build.shouldMinify,
    define
  });
  await build({
    entryPoints: [cacheHandlerEntrypoint],
    bundle: true,
    outfile: cacheHandlerCjsOutputFile,
    format: "cjs",
    platform: "node",
    target: "node18",
    minify: config.build.shouldMinify,
    define
  });
  const cacheHandlerImport = "import { OpenNextCacheHandler } from './" + cacheHandlerFileBase + ".mjs';\\n";
  let patchedCode = code.replace(
    /const \\{ cacheHandler \\} = this\\.nextConfig;/,
    "const cacheHandler = null;\\nCacheHandler = OpenNextCacheHandler;\\n"
  );
  if (patchedCode !== code) {
    return patchedCode.includes(cacheHandlerImport) ? patchedCode : cacheHandlerImport + patchedCode;
  }
  patchedCode = code.replace(
    /const \\{ incrementalCacheHandlerPath \\} = this\\.nextConfig\\.experimental;\\s+if \\(incrementalCacheHandlerPath\\) \\{\\s+CacheHandler = dynamicRequire\\(\\(0, _path\\.isAbsolute\\)\\(incrementalCacheHandlerPath\\) \\? incrementalCacheHandlerPath : \\(0, _path\\.join\\)\\(this\\.distDir, incrementalCacheHandlerPath\\)\\);\\s+CacheHandler = CacheHandler\\.default \\|\\| CacheHandler;\\s+\\}/,
    "const incrementalCacheHandlerPath = null;\\n        CacheHandler = OpenNextCacheHandler;"
  );
  if (patchedCode === code) {
    throw new Error("Patch \\\`patchCache\\\` not applied");
  }
  return patchedCode.includes(cacheHandlerImport) ? patchedCode : cacheHandlerImport + patchedCode;
}`;

function log(message) {
  console.log(message);
}

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function getSnippet(text, anchor) {
  const index = text.indexOf(anchor);
  if (index === -1) {
    return null;
  }

  const start = Math.max(0, index - 300);
  const end = Math.min(text.length, index + anchor.length + 300);
  return text.slice(start, end);
}

function getDiagnosticSnippet(text) {
  return (
    getSnippet(text, "incrementalCacheHandlerPath") ??
    getSnippet(text, "cacheHandler") ??
    getSnippet(text, "async function patchCache") ??
    text.slice(0, Math.min(text.length, 600))
  );
}

function failWithSnippet(message, text) {
  const snippet = getDiagnosticSnippet(text);
  log("PATCH DIAGNOSTIC SNIPPET START");
  log(snippet);
  log("PATCH DIAGNOSTIC SNIPPET END");
  throw new Error(message);
}

function assertPatched(text) {
  if (!text.includes(patchedMarker)) {
    failWithSnippet(`OpenNext compatibility patch missing in ${targetFile}`, text);
  }
}

log("PATCH START");
log(`PATCH TARGET: ${targetFile}`);

if (!fs.existsSync(targetFile)) {
  throw new Error(`OpenNext adapter file not found: ${targetFile}`);
}

if (!fs.existsSync(nextPackageFile)) {
  throw new Error(`Installed Next.js package not found: ${nextPackageFile}`);
}

const current = readFile(targetFile);
const nextPackage = JSON.parse(readFile(nextPackageFile));

log(`PATCH NEXT VERSION: ${nextPackage.version}`);

if (nextPackage.version !== supportedNextVersion) {
  throw new Error(
    `Installed Next.js version ${nextPackage.version} is unsupported for this adapter patch. Expected ${supportedNextVersion}.`
  );
}

if (verifyOnly) {
  log("PATCH VERIFY MODE");
  assertPatched(current);
  log("PATCH VERIFIED");
  process.exit(0);
}

const cachePatchAlreadyApplied =
  current.includes(patchedMarker) &&
  !current.includes(legacyDynamicRequireMarker) &&
  !current.includes(badAwaitImportMarker);

if (cachePatchAlreadyApplied) {
  log("PATCH ALREADY APPLIED");
  process.exit(0);
}

const patchFunctionFound = patchCacheFunctionPattern.test(current);
const oldPatternFound = oldCachePattern.test(current);
const incrementalPatternFound = incrementalCachePattern.test(current);

log(`PATCH FUNCTION FOUND: ${patchFunctionFound}`);
log(`PATCH OLD PATTERN FOUND: ${oldPatternFound}`);
log(`PATCH FALLBACK incrementalCacheHandlerPath FOUND: ${incrementalPatternFound}`);

if (!cachePatchAlreadyApplied && !patchFunctionFound) {
  failWithSnippet("Unable to locate the patchCache function in @opennextjs/cloudflare/dist/cli/index.mjs.", current);
}

if (
  !cachePatchAlreadyApplied &&
  !oldPatternFound &&
  !incrementalPatternFound &&
  !current.includes(legacyDynamicRequireMarker) &&
  !current.includes(badAwaitImportMarker)
) {
  failWithSnippet(
    "Unable to locate either supported cache handler pattern in @opennextjs/cloudflare/dist/cli/index.mjs.",
    current
  );
}

let replaced = cachePatchAlreadyApplied ? current : current.replace(patchCacheFunctionPattern, patchedFunction);

if (!cachePatchAlreadyApplied && replaced === current) {
  log("PATCH REPLACEMENT APPLIED: false");
  failWithSnippet("OpenNext adapter patch replacement did not modify the file.", current);
}

log("PATCH REPLACEMENT APPLIED: true");
fs.writeFileSync(targetFile, replaced);

const updated = readFile(targetFile);
assertPatched(updated);
log("PATCH COMPLETE");
