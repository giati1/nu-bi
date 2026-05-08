import fs from "fs/promises";
import path from "path";
import { chromium } from "playwright";

const profileDir = path.resolve(process.cwd(), ".playwright-profile", "dashboard-audit");

const urls = {
  cloudflare:
    "https://dash.cloudflare.com/?to=/:account/workers/services/view/nu-bi-preview/production/settings",
  github:
    "https://github.com/giati1/nu-bi/settings/secrets/actions",
  google:
    "https://console.cloud.google.com/apis/credentials"
};

const expected = {
  cloudflareVars: [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_REDIRECT_URI",
    "AI_AGENT_SCHEDULER_SECRET"
  ],
  githubSecrets: ["NUBI_AI_AGENT_SCHEDULER_SECRET"],
  googleRedirectUri: "https://nu-bi-preview.cedricfjohnson.workers.dev/api/auth/google/callback"
};

async function main() {
  await fs.mkdir(profileDir, { recursive: true });

  const context = await chromium.launchPersistentContext(profileDir, {
    headless: false,
    channel: "chrome",
    viewport: { width: 1440, height: 1000 }
  });

  const cloudflarePage = await getPage(context, "cloudflare");
  const githubPage = await getPage(context, "github");
  const googlePage = await getPage(context, "google");

  await Promise.all([
    cloudflarePage.goto(urls.cloudflare, { waitUntil: "domcontentloaded" }),
    githubPage.goto(urls.github, { waitUntil: "domcontentloaded" }),
    googlePage.goto(urls.google, { waitUntil: "domcontentloaded" })
  ]);

  console.log("Browser opened with persistent profile.");
  console.log("If login is required, complete it in the browser tabs.");
  console.log("The script will wait up to 5 minutes for pages to settle, then perform read-only checks.");

  const results = await Promise.all([
    inspectCloudflare(cloudflarePage),
    inspectGitHub(githubPage),
    inspectGoogle(googlePage)
  ]);

  const output = {
    timestamp: new Date().toISOString(),
    cloudflare: results[0],
    github: results[1],
    google: results[2]
  };

  console.log(JSON.stringify(output, null, 2));
  await fs.writeFile(
    path.resolve(process.cwd(), "tools", "audit-dashboard-output.json"),
    JSON.stringify(output, null, 2),
    "utf8"
  );

  console.log("Saved report to tools/audit-dashboard-output.json");
  console.log("Leaving browser open for manual review. Close it when done.");
}

async function getPage(context, name) {
  const existing = context.pages().find((page) => page.url().includes(name));
  return existing ?? (await context.newPage());
}

async function inspectCloudflare(page) {
  await waitForPossibleLogin(page);
  const bodyText = await safeBodyText(page);
  const found = expected.cloudflareVars.filter((name) => bodyText.includes(name));
  const missing = expected.cloudflareVars.filter((name) => !bodyText.includes(name));

  return {
    pageUrl: page.url(),
    found,
    missing,
    loggedInLikely: !isLoggedOutPage(bodyText)
  };
}

async function inspectGitHub(page) {
  await waitForPossibleLogin(page);
  const bodyText = await safeBodyText(page);
  const found = expected.githubSecrets.filter((name) => bodyText.includes(name));
  const missing = expected.githubSecrets.filter((name) => !bodyText.includes(name));

  return {
    pageUrl: page.url(),
    found,
    missing,
    loggedInLikely: !isLoggedOutPage(bodyText)
  };
}

async function inspectGoogle(page) {
  await waitForPossibleLogin(page);
  const bodyText = await safeBodyText(page);
  const hasRedirectUri = bodyText.includes(expected.googleRedirectUri);

  return {
    pageUrl: page.url(),
    redirectUriPresent: hasRedirectUri,
    missingRedirectUri: !hasRedirectUri,
    loggedInLikely: !isLoggedOutPage(bodyText)
  };
}

async function waitForPossibleLogin(page) {
  const timeoutAt = Date.now() + 5 * 60 * 1000;

  while (Date.now() < timeoutAt) {
    try {
      await page.waitForLoadState("domcontentloaded", { timeout: 5000 });
      const text = await safeBodyText(page);
      if (text && !isLoadingPage(text)) {
        return;
      }
    } catch {
      // Ignore transient navigation timeouts while user logs in manually.
    }
    await page.waitForTimeout(2000);
  }
}

async function safeBodyText(page) {
  try {
    return (
      (await page.locator("body").innerText({ timeout: 5000 }))
        .replace(/\s+/g, " ")
        .trim()
    );
  } catch {
    return "";
  }
}

function isLoadingPage(text) {
  return !text || /loading|please wait|just a moment/i.test(text);
}

function isLoggedOutPage(text) {
  return /sign in|log in|continue to console|github login|welcome to cloudflare/i.test(text);
}

main().catch((error) => {
  console.error("Dashboard audit failed:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
