#!/usr/bin/env node
/**
 * gmail-mcp — an MCP server that exposes read-only Gmail access as tools,
 * optimized for letting an MCP client (Claude Desktop, Cursor, etc.) extract
 * structured data from your inbox.
 *
 * Transport: stdio (the standard for local MCP servers).
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  searchEmails,
  readEmail,
  readEmailsBatch,
  listLabels,
  getThread,
  listAttachments,
  getAttachment,
} from "./gmail.js";

const server = new McpServer({
  name: "gmail-mcp",
  version: "0.1.0",
});

/** Wraps any value as a single JSON text content block. */
function jsonResult(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  };
}

/** Wraps an error as an error result the model can read and react to. */
function errorResult(message: string) {
  return {
    isError: true,
    content: [{ type: "text" as const, text: message }],
  };
}

server.tool(
  "search_emails",
  "Search Gmail messages using Gmail's query syntax (e.g. " +
    "'from:acme.com subject:invoice newer_than:30d'). Returns lightweight " +
    "summaries (id, from, subject, date, snippet). Use read_emails_batch to " +
    "pull full bodies for extraction.",
  {
    query: z.string().describe("Gmail search query, same syntax as the Gmail search box."),
    max_results: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe("Maximum messages to return (1-100, default 20)."),
  },
  async ({ query, max_results }) => {
    try {
      return jsonResult(await searchEmails(query, max_results ?? 20));
    } catch (e) {
      return errorResult(`search_emails failed: ${(e as Error).message}`);
    }
  }
);

server.tool(
  "read_email",
  "Read one Gmail message in full, including the decoded plain-text body and labels.",
  {
    id: z.string().describe("The message id (from search_emails)."),
  },
  async ({ id }) => {
    try {
      return jsonResult(await readEmail(id));
    } catch (e) {
      return errorResult(`read_email failed: ${(e as Error).message}`);
    }
  }
);

server.tool(
  "read_emails_batch",
  "Read many Gmail messages in full at once. Use this to pull a set of emails " +
    "so the model can extract structured data (contacts, orders, line items) " +
    "into a table or JSON.",
  {
    ids: z
      .array(z.string())
      .min(1)
      .max(50)
      .describe("Message ids to read in full (1-50)."),
  },
  async ({ ids }) => {
    try {
      return jsonResult(await readEmailsBatch(ids));
    } catch (e) {
      return errorResult(`read_emails_batch failed: ${(e as Error).message}`);
    }
  }
);

server.tool(
  "list_labels",
  "List the Gmail account's labels, useful for scoping searches (e.g. label:sales).",
  {},
  async () => {
    try {
      return jsonResult(await listLabels());
    } catch (e) {
      return errorResult(`list_labels failed: ${(e as Error).message}`);
    }
  }
);

server.tool(
  "get_thread",
  "Read an entire email thread (all messages, in order) in full. Use this when " +
    "context is spread across a back-and-forth conversation.",
  {
    thread_id: z.string().describe("The thread id (from search_emails / read_email)."),
  },
  async ({ thread_id }) => {
    try {
      return jsonResult(await getThread(thread_id));
    } catch (e) {
      return errorResult(`get_thread failed: ${(e as Error).message}`);
    }
  }
);

server.tool(
  "list_attachments",
  "List attachment metadata (filename, type, size, attachment id) for a message, " +
    "without downloading any bytes. Use before get_attachment to see what's there.",
  {
    message_id: z.string().describe("The message id (from search_emails)."),
  },
  async ({ message_id }) => {
    try {
      return jsonResult(await listAttachments(message_id));
    } catch (e) {
      return errorResult(`list_attachments failed: ${(e as Error).message}`);
    }
  }
);

server.tool(
  "get_attachment",
  "Download one attachment's bytes (Base64URL-encoded) by message id and " +
    "attachment id. Use list_attachments first to find the attachment id.",
  {
    message_id: z.string().describe("The message id."),
    attachment_id: z
      .string()
      .describe("The attachment id (from list_attachments)."),
  },
  async ({ message_id, attachment_id }) => {
    try {
      return jsonResult(await getAttachment(message_id, attachment_id));
    } catch (e) {
      return errorResult(`get_attachment failed: ${(e as Error).message}`);
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Log to stderr — stdout is reserved for the MCP protocol.
  console.error("gmail-mcp server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error starting gmail-mcp:", err);
  process.exit(1);
});
