const minimum = process.argv[2] ?? "20.3.0";
const current = process.versions.node;

if (compareVersions(current, minimum) < 0) {
  console.error(
    [
      `Cloudflare build and deploy commands require Node ${minimum}+.`,
      `Current Node version: ${current}.`,
      "Use Node 20+ for cf:* scripts, GitHub Actions, or Cloudflare deploy steps.",
      "Local app development can continue on the current Node version."
    ].join("\n")
  );
  process.exit(1);
}

function compareVersions(left, right) {
  const leftParts = left.split(".").map((value) => Number.parseInt(value, 10));
  const rightParts = right.split(".").map((value) => Number.parseInt(value, 10));
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const leftValue = leftParts[index] ?? 0;
    const rightValue = rightParts[index] ?? 0;

    if (leftValue > rightValue) {
      return 1;
    }
    if (leftValue < rightValue) {
      return -1;
    }
  }

  return 0;
}
