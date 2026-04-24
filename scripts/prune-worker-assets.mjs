import { rm } from "node:fs/promises";
import path from "node:path";

const generatedUploadsDir = path.resolve(process.cwd(), ".worker-next/assets/uploads");

await rm(generatedUploadsDir, { recursive: true, force: true });
console.log(`Pruned generated local uploads from ${generatedUploadsDir}`);
