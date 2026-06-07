/**
 * Interactive onboarding. Checks for the OAuth credentials file, prints clear
 * next steps if it's missing, then runs the read-only authorization flow.
 *
 * Run: npm run setup
 */
import fs from "node:fs";
import { CREDENTIALS_PATH, TOKEN_PATH, CONFIG_DIR } from "../src/auth.js";
import { runAuthorize } from "./authorize.js";

function printCredentialsHelp(): void {
  console.log(
    [
      "",
      "── gmail-mcp setup ─────────────────────────────────────────────",
      "",
      `No OAuth credentials found at:`,
      `  ${CREDENTIALS_PATH}`,
      "",
      "Create them once (free):",
      "  1. https://console.cloud.google.com/  → create or pick a project",
      "  2. APIs & Services → Library → enable 'Gmail API'",
      "  3. APIs & Services → OAuth consent screen → add your email as a Test user",
      "  4. APIs & Services → Credentials → Create credentials →",
      "     OAuth client ID → Application type: Desktop app",
      "  5. Download the JSON and save it as:",
      `       ${CREDENTIALS_PATH}`,
      "",
      "Then run `npm run setup` again.",
      "────────────────────────────────────────────────────────────────",
      "",
    ].join("\n")
  );
}

async function main(): Promise<void> {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });

  if (!fs.existsSync(CREDENTIALS_PATH)) {
    printCredentialsHelp();
    process.exit(1);
  }

  if (fs.existsSync(TOKEN_PATH)) {
    console.log(
      `Already authorized (token at ${TOKEN_PATH}).\n` +
        `Re-running will refresh it. Press Ctrl+C to keep the existing token.\n`
    );
  }

  console.log("Credentials found. Starting read-only authorization...\n");
  await runAuthorize();
  console.log(
    "\nAll set. Point your MCP client at this server (see README) and you're done."
  );
}

main().catch((e) => {
  console.error("setup failed:", (e as Error).message);
  process.exit(1);
});
