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
const cachePatchedMarker = "CacheHandler = OpenNextCacheHandler;";
const manifestPatchedMarker = 'globalThis.__RSC_MANIFEST = globalThis.__RSC_MANIFEST || {};';
const manifestLoaderPatchedMarker = "loadClientReferenceManifest(manifestPath, entryName)";
const badAwaitImportMarker =
  "CacheHandler = (await import('./\" + cacheHandlerFileBase + \".mjs')).OpenNextCacheHandler;";
const legacyDynamicRequireMarker =
  "CacheHandler = dynamicRequire((0, _path.join)(this.distDir, incrementalCacheHandlerPath));";
const legacyEvalManifestRequireMarker = "require(manifestPath)";
const verifyOnly = process.argv.includes("--verify");
const supportedNextVersion = "13.5.11";

const oldCachePattern = /const \{ cacheHandler \} = this\.nextConfig;/;
const incrementalCachePattern =
  /const \{ incrementalCacheHandlerPath \} = this\.nextConfig\.experimental;\s+if \(incrementalCacheHandlerPath\) \{\s+CacheHandler = dynamicRequire\(\(0, _path\.isAbsolute\)\(incrementalCacheHandlerPath\) \? incrementalCacheHandlerPath : \(0, _path\.join\)\(this\.distDir, incrementalCacheHandlerPath\)\);\s+CacheHandler = CacheHandler\.default \|\| CacheHandler;\s+\}/;
const patchCacheFunctionPattern = /async function patchCache\(code, config\) \{[\s\S]*?return patchedCode;\r?\n\}/;
const inlineEvalManifestSectionPattern =
  /(\/\/ src\/cli\/build\/patches\/to-investigate\/inline-eval-manifest\.ts\r?\n)function inlineEvalManifest\(code, config\) \{[\s\S]*?\r?\n(\/\/ src\/cli\/build\/patches\/to-investigate\/inline-middleware-manifest-require\.ts)/;

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

const patchedInlineEvalManifestFunction = [
  "function inlineEvalManifest(code, config) {",
  '  console.log("# inlineEvalManifest");',
  "  const manifestJss = globSync(",
  '    normalizePath(join5(config.paths.standaloneAppDotNext, "**", "*_client-reference-manifest.js"))',
  '  ).map((file) => normalizePath(file).replace(normalizePath(config.paths.standaloneApp) + posix3.sep, ""));',
  "  const manifestEntries = manifestJss.map((manifestJs) => {",
  "    const manifestFile = join5(config.paths.standaloneApp, manifestJs);",
  '    const manifestSource = readFileSync(manifestFile, "utf-8").trim();',
  "    const manifestMatch = manifestSource.match(",
  '      /^globalThis\\.__RSC_MANIFEST=\\(globalThis\\.__RSC_MANIFEST\\|\\|\\{\\}\\);globalThis\\.__RSC_MANIFEST\\["([^"]+)"\\]=(.*)$/',
  "    );",
  "    if (!manifestMatch) {",
  '      throw new Error("Unexpected client reference manifest format: " + manifestFile);',
  "    }",
  "    const [, manifestRoute, manifestPayload] = manifestMatch;",
  "    return {",
  "      manifestJs,",
  "      manifestPayload,",
  "      manifestRoute",
  "    };",
  "  });",
  '  const patchedCode = code.replace(',
  '    /async function loadClientReferenceManifest\\(manifestPath, entryName\\) \\{[\\s\\S]*?\\n    \\}/,',
  '    `async function loadClientReferenceManifest(manifestPath, entryName) {',
  '\t\tglobalThis.__RSC_MANIFEST = globalThis.__RSC_MANIFEST || {};',
  "\t\t${manifestEntries.map(",
  "      ({ manifestPayload, manifestRoute }) => `",
  '\t\tif (entryName === "${manifestRoute}") {',
  '\t\t\tglobalThis.__RSC_MANIFEST["${manifestRoute}"] = ${manifestPayload};',
  '\t\t\treturn globalThis.__RSC_MANIFEST["${manifestRoute}"];',
  "\t\t}",
  "\t\t`",
  '    ).join("\\n")}',
  "\t\treturn globalThis.__RSC_MANIFEST[entryName];",
  "\t}`",
  "  );",
  "  if (patchedCode === code) {",
  '    throw new Error("Patch `inlineEvalManifest` not applied");',
  "  }",
  "  return patchedCode;",
  "}"
].join("\n");

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
    getSnippet(text, "inlineEvalManifest") ??
    getSnippet(text, "__RSC_MANIFEST = globalThis.__RSC_MANIFEST || {};") ??
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

function countOccurrences(text, pattern) {
  return (text.match(pattern) ?? []).length;
}

function assertPatched(text) {
  if (!text.includes(cachePatchedMarker)) {
    failWithSnippet(`OpenNext cache compatibility patch missing in ${targetFile}`, text);
  }

  if (!text.includes(manifestPatchedMarker)) {
    failWithSnippet(`OpenNext manifest compatibility patch missing in ${targetFile}`, text);
  }

  if (text.includes(legacyEvalManifestRequireMarker)) {
    failWithSnippet(`OpenNext manifest compatibility patch still contains runtime require() in ${targetFile}`, text);
  }

  if (text.includes(legacyDynamicRequireMarker) || text.includes(badAwaitImportMarker)) {
    failWithSnippet(`OpenNext compatibility patch missing in ${targetFile}`, text);
  }

  const manifestSectionMatch = text.match(inlineEvalManifestSectionPattern);
  if (!manifestSectionMatch) {
    failWithSnippet(`OpenNext manifest compatibility patch section missing in ${targetFile}`, text);
  }

  const manifestSection = manifestSectionMatch[0];
  if (!manifestSection.includes(manifestLoaderPatchedMarker)) {
    failWithSnippet(`OpenNext manifest loader patch is missing in ${targetFile}`, text);
  }
}

function hasValidManifestPatch(text) {
  if (!text.includes(manifestPatchedMarker) || text.includes(legacyEvalManifestRequireMarker)) {
    return false;
  }

  const manifestSectionMatch = text.match(inlineEvalManifestSectionPattern);
  if (!manifestSectionMatch) {
    return false;
  }

  const manifestSection = manifestSectionMatch[0];
  return manifestSection.includes(manifestLoaderPatchedMarker);
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
  current.includes(cachePatchedMarker) &&
  !current.includes(legacyDynamicRequireMarker) &&
  !current.includes(badAwaitImportMarker);
const manifestPatchAlreadyApplied = hasValidManifestPatch(current);

if (cachePatchAlreadyApplied && manifestPatchAlreadyApplied) {
  log("PATCH ALREADY APPLIED");
  process.exit(0);
}

const patchFunctionFound = patchCacheFunctionPattern.test(current);
const inlineEvalManifestFunctionFound = inlineEvalManifestSectionPattern.test(current);
const oldPatternFound = oldCachePattern.test(current);
const incrementalPatternFound = incrementalCachePattern.test(current);

log(`PATCH FUNCTION FOUND: ${patchFunctionFound}`);
log(`PATCH inlineEvalManifest FUNCTION FOUND: ${inlineEvalManifestFunctionFound}`);
log(`PATCH OLD PATTERN FOUND: ${oldPatternFound}`);
log(`PATCH FALLBACK incrementalCacheHandlerPath FOUND: ${incrementalPatternFound}`);

if (!cachePatchAlreadyApplied && !patchFunctionFound) {
  failWithSnippet("Unable to locate the patchCache function in @opennextjs/cloudflare/dist/cli/index.mjs.", current);
}

if (!manifestPatchAlreadyApplied && !inlineEvalManifestFunctionFound) {
  failWithSnippet("Unable to locate the inlineEvalManifest function in @opennextjs/cloudflare/dist/cli/index.mjs.", current);
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

let replaced = current;

if (!cachePatchAlreadyApplied) {
  replaced = replaced.replace(patchCacheFunctionPattern, () => patchedFunction);
  if (replaced === current) {
    log("PATCH REPLACEMENT APPLIED: false");
    failWithSnippet("OpenNext cache patch replacement did not modify the file.", current);
  }
}

if (!manifestPatchAlreadyApplied) {
  const beforeManifestReplace = replaced;
  replaced = replaced.replace(
    inlineEvalManifestSectionPattern,
    (_, sectionHeader, nextSectionHeader) => `${sectionHeader}${patchedInlineEvalManifestFunction}\n\n${nextSectionHeader}`
  );
  if (replaced === beforeManifestReplace) {
    log("PATCH MANIFEST REPLACEMENT APPLIED: false");
    failWithSnippet("OpenNext manifest patch replacement did not modify the file.", beforeManifestReplace);
  }
}

log("PATCH REPLACEMENT APPLIED: true");
fs.writeFileSync(targetFile, replaced);

const updated = readFile(targetFile);
assertPatched(updated);
log("PATCH COMPLETE");
