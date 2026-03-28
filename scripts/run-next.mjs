import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");
const command = process.argv[2] ?? "dev";
const args = [nextBin, command];

if ((command === "dev" || command === "start") && !process.env.PORT) {
  process.env.PORT = "8000";
}

const child = spawn(process.execPath, args, {
  stdio: "inherit",
  env: process.env
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
