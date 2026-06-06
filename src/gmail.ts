/**
 * gmail.ts — thin, extraction-friendly wrapper over the Gmail API.
 *
 * Everything here is read-only. Bodies are decoded to plain text so the MCP
 * client's model can extract structured data without dealing with MIME.
 */
import { google, gmail_v1 } from "googleapis";
import { authorize } from "./auth.js";

export interface EmailSummary {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
}

export interface EmailFull extends EmailSummary {
  to: string;
  labels: string[];
  body: string;
}

export interface LabelInfo {
  id: string;
  name: string;
}

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

/* ------------------------------------------------------------------ */
/* Parsing helpers                                                     */
/* ------------------------------------------------------------------ */

function getHeader(
  headers: gmail_v1.Schema$MessagePartHeader[] | undefined,
  name: string
): string {
  const h = (headers ?? []).find(
    (x) => (x.name ?? "").toLowerCase() === name.toLowerCase()
  );
  return h?.value ?? "";
}

function toSummary(msg: gmail_v1.Schema$Message): EmailSummary {
  const headers = msg.payload?.headers;
  return {
    id: msg.id ?? "",
    threadId: msg.threadId ?? "",
    from: getHeader(headers, "From"),
    subject: getHeader(headers, "Subject"),
    date: getHeader(headers, "Date"),
    snippet: msg.snippet ?? "",
  };
}

function toFull(msg: gmail_v1.Schema$Message): EmailFull {
  const headers = msg.payload?.headers;
  return {
    ...toSummary(msg),
    to: getHeader(headers, "To"),
    labels: msg.labelIds ?? [],
    body: extractPlainBody(msg.payload),
  };
}

function decode(data?: string | null): string {
  return data ? Buffer.from(data, "base64url").toString("utf8") : "";
}

/**
 * Walks the MIME tree and returns the first text/plain body found. Falls back
 * to any text/* part if no text/plain exists.
 */
function extractPlainBody(
  payload: gmail_v1.Schema$MessagePart | undefined
): string {
  if (!payload) return "";

  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decode(payload.body.data);
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractPlainBody(part);
      if (text) return text;
    }
  }

  if (payload.mimeType?.startsWith("text/") && payload.body?.data) {
    return decode(payload.body.data);
  }

  return "";
}
