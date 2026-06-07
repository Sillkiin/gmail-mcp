/**
 * Unit tests for the Gmail message parser. Uses a recorded-shape fixture, so
 * no network or OAuth is required. Run with: npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { gmail_v1 } from "googleapis";
import {
  getHeader,
  decode,
  extractPlainBody,
  extractAttachments,
  toSummary,
  toFull,
} from "../src/parse.js";

/** Gmail returns body data as URL-safe base64; build fixtures the same way. */
function b64url(text: string): string {
  return Buffer.from(text, "utf8").toString("base64url");
}

const PLAIN_BODY = "Hi,\n\nWe're Acme Corp and we'd like a demo.\n\nJane Doe\nacme.com";

/** A multipart/alternative message with both text/plain and text/html parts. */
const multipartMessage: gmail_v1.Schema$Message = {
  id: "msg_1",
  threadId: "thr_1",
  labelIds: ["INBOX", "Label_sales"],
  snippet: "Hi, We're Acme Corp and we'd like a demo.",
  payload: {
    mimeType: "multipart/alternative",
    headers: [
      { name: "From", value: "Jane Doe <jane@acme.com>" },
      { name: "To", value: "sales@yourco.com" },
      { name: "Subject", value: "Demo request" },
      { name: "Date", value: "Tue, 02 Jun 2026 10:00:00 +0000" },
    ],
    parts: [
      { mimeType: "text/plain", body: { data: b64url(PLAIN_BODY) } },
      {
        mimeType: "text/html",
        body: { data: b64url("<p>Hi, We're Acme Corp and we'd like a demo.</p>") },
      },
    ],
  },
};

test("getHeader is case-insensitive and returns '' when missing", () => {
  const headers = multipartMessage.payload!.headers!;
  assert.equal(getHeader(headers, "from"), "Jane Doe <jane@acme.com>");
  assert.equal(getHeader(headers, "SUBJECT"), "Demo request");
  assert.equal(getHeader(headers, "Reply-To"), "");
  assert.equal(getHeader(undefined, "From"), "");
});

test("decode handles URL-safe base64 and empty input", () => {
  assert.equal(decode(b64url("a+b/c subject?")), "a+b/c subject?");
  assert.equal(decode(undefined), "");
  assert.equal(decode(null), "");
});

test("extractPlainBody prefers text/plain over text/html", () => {
  assert.equal(extractPlainBody(multipartMessage.payload!), PLAIN_BODY);
});

test("extractPlainBody handles a single-part text/plain message", () => {
  const single: gmail_v1.Schema$MessagePart = {
    mimeType: "text/plain",
    body: { data: b64url("just text") },
  };
  assert.equal(extractPlainBody(single), "just text");
});

test("extractPlainBody returns '' when there is no text part", () => {
  const imageOnly: gmail_v1.Schema$MessagePart = {
    mimeType: "image/png",
    body: { data: b64url("not really an image") },
  };
  assert.equal(extractPlainBody(imageOnly), "");
  assert.equal(extractPlainBody(undefined), "");
});

test("toSummary maps the lightweight fields", () => {
  const s = toSummary(multipartMessage);
  assert.deepEqual(s, {
    id: "msg_1",
    threadId: "thr_1",
    from: "Jane Doe <jane@acme.com>",
    subject: "Demo request",
    date: "Tue, 02 Jun 2026 10:00:00 +0000",
    snippet: "Hi, We're Acme Corp and we'd like a demo.",
  });
});

test("toFull adds to, labels, and decoded body", () => {
  const f = toFull(multipartMessage);
  assert.equal(f.to, "sales@yourco.com");
  assert.deepEqual(f.labels, ["INBOX", "Label_sales"]);
  assert.equal(f.body, PLAIN_BODY);
  // still carries the summary fields
  assert.equal(f.from, "Jane Doe <jane@acme.com>");
});

test("toSummary tolerates a near-empty message", () => {
  const s = toSummary({ id: "x" });
  assert.equal(s.id, "x");
  assert.equal(s.from, "");
  assert.equal(s.snippet, "");
});

test("extractAttachments finds attachments nested in the MIME tree", () => {
  const withAttachment: gmail_v1.Schema$Message = {
    id: "msg_2",
    payload: {
      mimeType: "multipart/mixed",
      parts: [
        { mimeType: "text/plain", body: { data: b64url("see attached") } },
        {
          mimeType: "application/pdf",
          filename: "invoice.pdf",
          body: { attachmentId: "att_123", size: 24680 },
        },
      ],
    },
  };
  const atts = extractAttachments(withAttachment.payload);
  assert.equal(atts.length, 1);
  assert.deepEqual(atts[0], {
    attachmentId: "att_123",
    filename: "invoice.pdf",
    mimeType: "application/pdf",
    size: 24680,
  });
});

test("extractAttachments returns [] when there are none", () => {
  assert.deepEqual(extractAttachments(multipartMessage.payload), []);
  assert.deepEqual(extractAttachments(undefined), []);
});
