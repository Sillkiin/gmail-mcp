/**
 * parse.ts — pure helpers for turning Gmail API message objects into the flat,
 * extraction-friendly shapes the tools return. Kept separate from gmail.ts so
 * they can be unit-tested without any network or OAuth.
 */
import { gmail_v1 } from "googleapis";

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

export interface AttachmentInfo {
  attachmentId: string;
  filename: string;
  mimeType: string;
  size: number;
}

/** Case-insensitive header lookup. Returns "" if absent. */
export function getHeader(
  headers: gmail_v1.Schema$MessagePartHeader[] | undefined,
  name: string
): string {
  const h = (headers ?? []).find(
    (x) => (x.name ?? "").toLowerCase() === name.toLowerCase()
  );
  return h?.value ?? "";
}

/** Decodes Gmail's URL-safe base64 body data to UTF-8. */
export function decode(data?: string | null): string {
  return data ? Buffer.from(data, "base64url").toString("utf8") : "";
}

/**
 * Walks the MIME tree and returns the first text/plain body found. Falls back
 * to any text/* part if no text/plain exists. Returns "" if there is no text.
 */
export function extractPlainBody(
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

export function toSummary(msg: gmail_v1.Schema$Message): EmailSummary {
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

export function toFull(msg: gmail_v1.Schema$Message): EmailFull {
  const headers = msg.payload?.headers;
  return {
    ...toSummary(msg),
    to: getHeader(headers, "To"),
    labels: msg.labelIds ?? [],
    body: extractPlainBody(msg.payload),
  };
}

/**
 * Walks the MIME tree and collects attachment metadata (anything with a
 * filename and an attachmentId). Returns [] when there are no attachments.
 */
export function extractAttachments(
  payload: gmail_v1.Schema$MessagePart | undefined
): AttachmentInfo[] {
  const out: AttachmentInfo[] = [];
  const walk = (part?: gmail_v1.Schema$MessagePart): void => {
    if (!part) return;
    const filename = part.filename ?? "";
    const attachmentId = part.body?.attachmentId ?? "";
    if (filename && attachmentId) {
      out.push({
        attachmentId,
        filename,
        mimeType: part.mimeType ?? "",
        size: part.body?.size ?? 0,
      });
    }
    (part.parts ?? []).forEach(walk);
  };
  walk(payload);
  return out;
}
