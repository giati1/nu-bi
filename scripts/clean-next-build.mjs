import { access, rm } from "node:fs/promises";
import path from "node:path";

const nextBuildDir = path.resolve(process.cwd(), ".next");

if (await pathExists(nextBuildDir)) {
  await removeWithRetries(nextBuildDir);
  console.log(`Removed stale Next build output from ${nextBuildDir}`);
}

async function pathExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function removeWithRetries(targetPath) {
  let lastError = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await rm(targetPath, { recursive: true, force: true, maxRetries: 2, retryDelay: 150 });
      return;
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || attempt === 4) {
        throw error;
      }
      await wait(250 * (attempt + 1));
    }
  }

  throw lastError;
}

function isRetryable(error) {
  return Boolean(
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error.code === "EBUSY" || error.code === "ENOTEMPTY" || error.code === "EPERM")
  );
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
