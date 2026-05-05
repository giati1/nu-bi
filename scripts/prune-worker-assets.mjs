import { access, rm } from "node:fs/promises";
import path from "node:path";

const generatedUploadsDir = path.resolve(process.cwd(), ".worker-next/assets/uploads");

if (!(await pathExists(generatedUploadsDir))) {
  console.log(`No generated local uploads found at ${generatedUploadsDir}`);
  process.exit(0);
}

await removeWithRetries(generatedUploadsDir);
console.log(`Pruned generated local uploads from ${generatedUploadsDir}`);

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

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      await rm(targetPath, { recursive: true, force: true });
      return;
    } catch (error) {
      lastError = error;
      if (!isBusyError(error) || attempt === 3) {
        throw error;
      }
      await wait(250 * (attempt + 1));
    }
  }

  throw lastError;
}

function isBusyError(error) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "EBUSY");
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
