import { ensureDatabase } from "../lib/db/client";

async function main() {
  await ensureDatabase();
  console.log("Nu-bi database initialized.");
}

void main();
