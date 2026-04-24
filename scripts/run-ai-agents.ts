import { ensureDatabase } from "../lib/db/client";
import { runAgentNow, runAllEligibleAgentsOnce } from "../lib/ai-agents/scheduler";

async function main() {
  await ensureDatabase();

  const args = process.argv.slice(2);
  const agentFlag = args.find((arg) => arg.startsWith("--agent="));

  if (agentFlag) {
    const agent = agentFlag.slice("--agent=".length).trim();
    const result = await runAgentNow(agent);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const results = await runAllEligibleAgentsOnce();
  console.log(JSON.stringify(results, null, 2));
}

void main();
