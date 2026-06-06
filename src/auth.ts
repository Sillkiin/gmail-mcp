/**
 * auth.ts — Google OAuth2 client loading.
 *
 * Credentials and the minted token live in a config directory (default
 * ~/.gmail-mcp), never in the repo. The server only ever requests read-only
 * Gmail scope.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { OAuth2Client } from "google-auth-library";

export const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

export const CONFIG_DIR =
  process.env.GMAIL_MCP_DIR || path.join(os.homedir(), ".gmail-mcp");
export const CREDENTIALS_PATH = path.join(CONFIG_DIR, "credentials.json");
export const TOKEN_PATH = path.join(CONFIG_DIR, "token.json");

/** Loopback redirect used by the one-time authorize flow. */
export const REDIRECT_URI = "http://127.0.0.1:4571/oauth2callback";

interface OAuthCredentialsFile {
  installed?: { client_id: string; client_secret: string; redirect_uris?: string[] };
  web?: { client_id: string; client_secret: string; redirect_uris?: string[] };
}

/**
 * Builds an OAuth2 client from the downloaded credentials.json. Throws a clear
 * error if the file is missing.
 */
export function loadOAuthClient(): OAuth2Client {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error(
      `Missing OAuth credentials at ${CREDENTIALS_PATH}. ` +
        `Create an OAuth client (type: Desktop app) in Google Cloud Console, ` +
        `download it, and save it there. See the README.`
    );
  }
  const raw = fs.readFileSync(CREDENTIALS_PATH, "utf8");
  const parsed = JSON.parse(raw) as OAuthCredentialsFile;
  const creds = parsed.installed ?? parsed.web;
  if (!creds) {
    throw new Error(
      `credentials.json is not a valid OAuth client file (expected an "installed" or "web" key).`
    );
  }
  return new OAuth2Client(
    creds.client_id,
    creds.client_secret,
    creds.redirect_uris?.[0] ?? REDIRECT_URI
  );
}

/**
 * Returns an authorized OAuth2 client. Throws if the user has not run the
 * one-time authorize flow yet.
 */
export function authorize(): OAuth2Client {
  const client = loadOAuthClient();
  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error(
      `Not authorized yet. Run "npm run authorize" once to grant read-only Gmail access.`
    );
  }
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
  client.setCredentials(token);
  return client;
}
