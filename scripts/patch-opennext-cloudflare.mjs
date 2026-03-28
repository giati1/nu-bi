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
  let patchedCode = code.replace(
    /const \\{ cacheHandler \\} = this\\.nextConfig;/,
    "const cacheHandler = null;\\nCacheHandler = (await import('./" + cacheHandlerFileBase + ".mjs')).OpenNextCacheHandler;\\n"
  );
  if (patchedCode !== code) {
    return patchedCode;
  }
  patchedCode = code.replace(
    /const \\{ incrementalCacheHandlerPath \\} = this\\.nextConfig\\.experimental;\\s+if \\(incrementalCacheHandlerPath\\) \\{\\s+CacheHandler = dynamicRequire\\(\\(0, _path\\.isAbsolute\\)\\(incrementalCacheHandlerPath\\) \\? incrementalCacheHandlerPath : \\(0, _path\\.join\\)\\(this\\.distDir, incrementalCacheHandlerPath\\)\\);\\s+CacheHandler = CacheHandler\\.default \\|\\| CacheHandler;\\s+\\}/,
    "const incrementalCacheHandlerPath = \\"./" + cacheHandlerFileBase + ".cjs\\";\\n        CacheHandler = dynamicRequire((0, _path.join)(this.distDir, incrementalCacheHandlerPath));\\n        CacheHandler = CacheHandler.OpenNextCacheHandler || CacheHandler.default || CacheHandler;"
  );
  if (patchedCode === code) {
    throw new Error("Patch \\\`patchCache\\\` not applied");
  }
  return patchedCode;
}`;

if (!fs.existsSync(targetFile)) {
  console.log("OpenNext adapter not installed yet; skipping compatibility patch.");
  process.exit(0);
}

const current = fs.readFileSync(targetFile, "utf8");

if (current.includes('const incrementalCacheHandlerPath = "./" + cacheHandlerFileBase + ".cjs";')) {
  console.log("OpenNext compatibility patch already present.");
  process.exit(0);
}

const patchCachePattern = /async function patchCache\(code, config\) \{[\s\S]*?return patchedCode;\r?\n\}/;

if (!patchCachePattern.test(current)) {
  throw new Error("Unable to locate the expected patchCache function in @opennextjs/cloudflare 0.2.1.");
}

fs.writeFileSync(targetFile, current.replace(patchCachePattern, patchedFunction));
console.log("Applied OpenNext compatibility patch for Next 13.5.11 incremental cache handling.");
