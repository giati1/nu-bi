import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:8000",
    headless: true
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:8000/login",
    reuseExistingServer: true,
    timeout: 120_000
  }
});
