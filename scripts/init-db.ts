import { ensureDatabase } from "../lib/db/client";

async function main() {
  await ensureDatabase();
  console.log("NUBI database initialized.");
}

void main();
