/**
 * gmail.ts — thin, extraction-friendly wrapper over the Gmail API.
 *
 * Everything here is read-only. Parsing lives in parse.ts so it can be tested
 * without network or OAuth.
 */
import { google, gmail_v1 } from "googleapis";
import { authorize } from "./auth.js";
import {
  EmailSummary,
  EmailFull,
  LabelInfo,
  toSummary,
  toFull,
} from "./parse.js";

export type { EmailSummary, EmailFull, LabelInfo } from "./parse.js";

let cached: gmail_v1.Gmail | null = null;

function gmailClient(): gmail_v1.Gmail {
  if (cached) return cached;
  cached = google.gmail({ version: "v1", auth: authorize() });
  return cached;
}

/** Searches messages with a Gmail query string (same syntax as the Gmail search box). */
export async function searchEmails(
  query: string,
  maxResults = 20
): Promise<EmailSummary[]> {
  const gmail = gmailClient();
  const list = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults: Math.min(Math.max(maxResults, 1), 100),
  });
  const messages = list.data.messages ?? [];
  return Promise.all(
    messages.map(async (m) => {
      const msg = await gmail.users.messages.get({
        userId: "me",
        id: m.id!,
        format: "metadata",
        metadataHeaders: ["From", "Subject", "Date"],
      });
      return toSummary(msg.data);
    })
  );
}

/** Reads a single message in full, with decoded plain-text body. */
export async function readEmail(id: string): Promise<EmailFull> {
  const gmail = gmailClient();
  const msg = await gmail.users.messages.get({
    userId: "me",
    id,
    format: "full",
  });
  return toFull(msg.data);
}

/** Reads many messages in full — convenient for extracting a batch into a table. */
export async function readEmailsBatch(ids: string[]): Promise<EmailFull[]> {
  return Promise.all(ids.map((id) => readEmail(id)));
}

/** Lists the account's labels (useful for scoping searches). */
export async function listLabels(): Promise<LabelInfo[]> {
  const gmail = gmailClient();
  const res = await gmail.users.labels.list({ userId: "me" });
  return (res.data.labels ?? []).map((l) => ({
    id: l.id ?? "",
    name: l.name ?? "",
  }));
}
