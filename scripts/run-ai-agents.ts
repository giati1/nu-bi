const DEFAULT_RUNNER_URL =
  "https://nu-bi-preview.cedricfjohnson.workers.dev/api/internal/run-ai-agents";

async function main() {
  const runnerUrl = process.env.AI_AGENT_RUNNER_URL?.trim() || DEFAULT_RUNNER_URL;

  const response = await fetch(runnerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    console.error(
      JSON.stringify(
        {
          runnerUrl,
          status: response.status,
          error: payload?.error ?? "Failed to run AI agents in preview."
        },
        null,
        2
      )
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    JSON.stringify(
      {
        runnerUrl,
        databaseDriver: payload?.databaseDriver ?? "unknown",
        cloudflareEnv: payload?.cloudflareEnv ?? "unknown",
        postsCreated: payload?.postsCreated ?? 0,
        imagePostsCreated: payload?.imagePostsCreated ?? 0,
        directMessagesCreated: payload?.directMessagesCreated ?? 0,
        introductionsCreated: payload?.introductionsCreated ?? 0,
        continuedThreads: payload?.continuedThreads ?? 0,
        regularAccountsContacted: payload?.regularAccountsContacted ?? 0,
        topicHeadline: payload?.topicHeadline ?? null,
        results: payload?.results ?? []
      },
      null,
      2
    )
  );
}

void main();

export {};
