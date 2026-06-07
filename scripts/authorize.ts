/**
 * One-time OAuth flow. Opens a local loopback server, opens the consent URL in
 * the browser, exchanges the returned code for tokens, and writes them to the
 * config dir. Exposed as runAuthorize() so the setup script can reuse it.
 *
 * Run directly: npm run authorize
 */
import http from "node:http";
import fs from "node:fs";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import {
  loadOAuthClient,
  SCOPES,
  TOKEN_PATH,
  CONFIG_DIR,
  REDIRECT_URI,
} from "../src/auth.js";

const PORT = 4571;

/** Best-effort cross-platform "open this URL in the default browser". */
function openBrowser(url: string): void {
  const cmd =
    process.platform === "win32"
      ? "cmd"
      : process.platform === "darwin"
        ? "open"
        : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  try {
    spawn(cmd, args, { stdio: "ignore", detached: true }).unref();
  } catch {
    /* fall back to the printed URL */
  }
}

export function runAuthorize(): Promise<void> {
  return new Promise((resolve, reject) => {
    let client;
    try {
      client = loadOAuthClient();
    } catch (e) {
      reject(e);
      return;
    }

    const authUrl = client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      prompt: "consent",
    });

    console.log("\nOpening your browser to grant read-only Gmail access...");
    console.log("If it doesn't open, paste this URL manually:\n");
    console.log(authUrl + "\n");
    openBrowser(authUrl);

    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`);
        if (!url.pathname.startsWith("/oauth2callback")) {
          res.writeHead(404).end();
          return;
        }
        const code = url.searchParams.get("code");
        if (!code) {
          res.writeHead(400).end("Missing authorization code.");
          return;
        }

        const { tokens } = await client.getToken(code);
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));

        res
          .writeHead(200, { "Content-Type": "text/html" })
          .end("<h2>Authorized.</h2><p>You can close this tab and return to the terminal.</p>");
        console.log(`\nSaved token to ${TOKEN_PATH}\nDone — you're authorized.`);
        server.close();
        resolve();
      } catch (e) {
        res.writeHead(500).end("Authorization failed: " + (e as Error).message);
        server.close();
        reject(e);
      }
    });

    server.on("error", reject);
    server.listen(PORT, () =>
      console.log(`Waiting for the redirect to ${REDIRECT_URI} ...`)
    );
  });
}

// Run only when invoked directly (node dist/scripts/authorize.js), not on import.
const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  runAuthorize()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error("authorize failed:", (e as Error).message);
      process.exit(1);
    });
}
