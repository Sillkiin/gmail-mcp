# gmail-mcp

[![CI](https://github.com/Sillkiin/gmail-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Sillkiin/gmail-mcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/Model_Context_Protocol-server-7c3aed)](https://modelcontextprotocol.io)

**Turn your Gmail into structured data, from inside Claude or Cursor.**

`gmail-mcp` is a [Model Context Protocol](https://modelcontextprotocol.io) server that
gives an MCP client (Claude Desktop, Cursor, Claude Code, etc.) **read-only** access to
your Gmail — with tools tuned for one job: letting the model **pull contacts, orders,
invoices, and line items out of your inbox and into a table or JSON.**

It is not another "send email" bot. It exposes clean search + batch-read tools, and the
model you're already talking to does the extraction.

```
You:    "Find my sales inquiries from the last 30 days and make a table of
         company, contact email, and what they asked for."

Claude: → search_emails("label:sales newer_than:30d")
        → read_emails_batch([...ids])
        → returns a clean table, extracted by Claude itself
```

> ⚠️ **Status: v0.1.** The server is built and the MCP handshake + tool registration are
> verified. The Gmail calls require your own Google OAuth credentials (setup below). Treat
> it as early but functional; issues and PRs welcome.

## Why this exists

Every "get data out of my email" task today is manual copy-paste. With `gmail-mcp`, you
ask in plain language and the model fetches and structures it. Because extraction happens
in the client model, you get the full power of Claude's reasoning over your real inbox —
no brittle regex, no separate pipeline.

## Tools

| Tool | What it does |
|------|--------------|
| `search_emails` | Search with Gmail query syntax (`from:`, `subject:`, `newer_than:`, `label:`…). Returns lightweight summaries. |
| `read_email` | Read one message in full, with decoded plain-text body and labels. |
| `read_emails_batch` | Read up to 50 messages at once — the workhorse for extracting a set into a table. |
| `get_thread` | Read an entire thread (all messages, in order) when context spans a back-and-forth. |
| `list_attachments` | List attachment metadata (filename, type, size, id) for a message — no bytes downloaded. |
| `get_attachment` | Download one attachment's bytes (Base64URL) by message + attachment id. |
| `list_labels` | List labels, to scope searches. |

All tools are **read-only** (`gmail.readonly` scope). This server cannot send, delete, or
modify anything.

## Quick start

### 1. Install & build

**Option A — zero clone (run straight from GitHub):**
```bash
npx github:Sillkiin/gmail-mcp
```
`npx` fetches the repo, builds it (via the `prepare` script), and runs the server. You
still do the one-time OAuth steps below; point your client `command`/`args` at the same
`npx` invocation.

**Option B — clone (recommended while developing):**
```bash
git clone https://github.com/Sillkiin/gmail-mcp.git
cd gmail-mcp
npm install        # also builds via the prepare script
```

### 2. Get Google OAuth credentials (one time)
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create (or pick) a project → **APIs & Services → Enable APIs → enable "Gmail API"**.
3. **Credentials → Create credentials → OAuth client ID → Application type: Desktop app.**
4. Download the JSON and save it as `~/.gmail-mcp/credentials.json`
   (Windows: `%USERPROFILE%\.gmail-mcp\credentials.json`).
   - Under **OAuth consent screen**, add your own email as a **test user**.

### 3. Authorize (one time)
```bash
npm run setup
```
`setup` checks your credentials, then opens the consent screen in your browser, captures the
redirect on `http://127.0.0.1:4571/oauth2callback`, and writes `token.json` next to your
credentials. Read-only scope only. (Prefer the bare flow? `npm run authorize` does just the
OAuth step.)

### 4. Wire it into your MCP client

**Claude Desktop** — add to `claude_desktop_config.json`
(macOS: `~/Library/Application Support/Claude/`, Windows: `%APPDATA%\Claude\`):
```json
{
  "mcpServers": {
    "gmail": {
      "command": "node",
      "args": ["ABSOLUTE/PATH/TO/gmail-mcp/dist/src/index.js"]
    }
  }
}
```

**Cursor** — add to `~/.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "gmail": {
      "command": "node",
      "args": ["ABSOLUTE/PATH/TO/gmail-mcp/dist/src/index.js"]
    }
  }
}
```

Restart the client. You should see the `gmail` server and its four tools.

## Example prompts

- *"Pull every order confirmation from this month and list order #, total, and date."*
- *"Find emails from recruiters in the last 60 days; table of company, role, contact."*
- *"Summarize the 10 most recent threads in `label:support` with the customer's issue."*
- *"Extract all the invoices in `label:finance newer_than:90d` into JSON with vendor, amount, due date."*

The model calls `search_emails` → `read_emails_batch` and does the extraction itself.

`search_emails` takes structured filters so the model doesn't have to hand-write query
syntax: `from`, `to`, `subject`, `label`, `newer_than` (`30d`/`6m`/`1y`), `after`/`before`
(`YYYY/MM/DD`), `has_attachment`, `is_unread` — plus a raw `query` passthrough. They're all
combined into one Gmail query.

## Configuration

| Env var | Default | Purpose |
|---------|---------|---------|
| `GMAIL_MCP_DIR` | `~/.gmail-mcp` | Where `credentials.json` and `token.json` live |

## Security & privacy

- **Read-only.** The server requests only `gmail.readonly`. It cannot send or delete mail.
- **Your credentials stay local.** `credentials.json` and `token.json` live in your config
  dir and are git-ignored. Never commit them.
- **Your inbox content** is read by the server and passed to whatever MCP client you connect
  — review that client's data handling.

## Roadmap

- [x] Attachment listing & download tool
- [x] Thread-level read (`get_thread`)
- [x] Zero-clone install (`npx github:Sillkiin/gmail-mcp`)
- [x] Tests against a recorded Gmail fixture
- [x] Date/sender filters as first-class `search_emails` params
- [x] One-command onboarding (`npm run setup`)
- [x] npm publish prepared (release workflow + provenance) — see [docs/PUBLISHING.md](docs/PUBLISHING.md)
- [ ] Publish the first npm release (`npm version` + push tag)

Contributions welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).

## How it works

```
MCP client (Claude / Cursor)
        │  stdio (JSON-RPC)
        ▼
   gmail-mcp server  ──►  Gmail API (read-only)
   search / read / batch / labels
```

The server is intentionally thin: it provides clean access, and the client's model supplies
the intelligence (extraction, summarization, table-building).

## Development

```bash
npm install      # install + build
npm run build    # recompile
npm test         # build + run unit tests (no Gmail/OAuth needed)
```

The MIME/header parsing lives in `src/parse.ts` and is covered by fixture-based tests in
`test/` — they run in CI on every push. Recording a demo GIF? See
[`docs/DEMO.md`](docs/DEMO.md).

## License

[MIT](LICENSE).
