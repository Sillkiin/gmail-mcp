/**
 * One-time OAuth flow. Opens a local loopback server, prints the consent URL,
 * exchanges the returned code for tokens, and writes them to the config dir.
 *
 * Run: npm run build && npm run authorize
 */
import http from "node:http";
import fs from "node:fs";
import {
  loadOAuthClient,
  SCOPES,
  TOKEN_PATH,
  CONFIG_DIR,
  REDIRECT_URI,
} from "../src/auth.js";

const PORT = 4571;

async function main() {
  const client = loadOAuthClient();

  const authUrl = client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });

  console.log("\n1. Open this URL in your browser and grant access:\n");
  console.log(authUrl + "\n");
  console.log(`2. Waiting for the redirect to ${REDIRECT_URI} ...\n`);

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

      res.writeHead(200, { "Content-Type": "text/html" }).end(
        "<h2>Authorized.</h2><p>You can close this tab and return to the terminal.</p>"
      );
      console.log(`Saved token to ${TOKEN_PATH}\nDone.`);
      server.close();
      process.exit(0);
    } catch (e) {
      res.writeHead(500).end("Authorization failed: " + (e as Error).message);
      console.error("Authorization failed:", (e as Error).message);
      server.close();
      process.exit(1);
    }
  });

  server.listen(PORT);
}

main().catch((e) => {
  console.error("authorize failed:", (e as Error).message);
  process.exit(1);
});
