import { ensureDatabase } from "../lib/db/client";

async function main() {
  await ensureDatabase();
  console.log("NOMI database initialized.");
}

void main();
