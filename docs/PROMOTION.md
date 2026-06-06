# Launch / promotion kit

Honest, organic promotion only. The goal is to put a genuinely useful tool in front of
people who'd want it — not to inflate numbers. Lead with the demo GIF everywhere.

> Replace `Sillkiin/gmail-mcp` and the demo link with your final values before posting.
> Post the GIF first; the words are secondary.

---

## 1. MCP directories (highest-intent audience)

Open a PR adding gmail-mcp to community lists. These readers actively collect and star
MCP servers, so this is the most direct channel.

- `punkpeye/awesome-mcp-servers`
- `wong2/awesome-mcp-servers`
- The official `modelcontextprotocol/servers` "community servers" list

**Suggested list entry:**
> **[gmail-mcp](https://github.com/Sillkiin/gmail-mcp)** — Read-only Gmail access tuned
> for data extraction. Let Claude/Cursor pull contacts, orders, and invoices from your
> inbox into tables or JSON.

---

## 2. Show HN

**Title:**
> Show HN: Gmail MCP server that lets Claude extract your inbox into tables

**Body:**
> I kept copy-pasting data out of emails by hand — order numbers, leads, invoices — so I
> built a small MCP server that gives Claude (or Cursor) read-only access to Gmail with
> tools tuned for extraction: search, read, and batch-read.
>
> The server stays deliberately thin — it just provides clean access, and the model you're
> already talking to does the extraction. So you can say "find my sales inquiries from the
> last 30 days and make a table of company, contact, and what they asked for," and it does.
>
> Read-only scope (`gmail.readonly`) — it can't send or delete anything. TypeScript, MIT.
> OAuth is your own Google credentials; nothing is proxied through me.
>
> Repo + demo: https://github.com/Sillkiin/gmail-mcp
> Feedback welcome — especially on the auth UX, which is the rough edge right now.

Post around 8–10am ET on a weekday. Reply to every comment.

---

## 3. Reddit

### r/ClaudeAI
**Title:** I built a read-only Gmail MCP server so Claude can turn my inbox into tables

**Body:**
> Sharing a small open-source MCP server I made: it gives Claude Desktop read-only access
> to Gmail with search/read/batch tools. The point isn't another email bot — it's that
> Claude can now *extract* structured data from your mail (contacts, orders, invoices) into
> a table or JSON, just by asking.
>
> Read-only scope, runs locally, your own Google OAuth. TypeScript + MIT.
>
> Demo + repo: https://github.com/Sillkiin/gmail-mcp
>
> Curious what extractions people would want — happy to add tools.

### r/cursor
Same body, swap "Claude Desktop" → "Cursor" and mention the `~/.cursor/mcp.json` config.

> Follow each subreddit's self-promotion rules — comment in relevant threads first, don't
> only drop links.

---

## 4. X / Twitter thread

**Tweet 1 (attach the GIF):**
> I was tired of copy-pasting data out of Gmail, so I built an MCP server that lets Claude
> do it.
>
> "find my sales inquiries this month → table of company, contact, ask" — and it just does it.
>
> Read-only, local, open source 🧵

**Tweet 2:**
> It's intentionally thin: the server gives Claude clean Gmail access (search / read /
> batch-read), and Claude does the extraction. No brittle parsers, no separate pipeline.

**Tweet 3:**
> Read-only `gmail.readonly` scope — it literally cannot send or delete mail. Your own
> Google OAuth, nothing proxied. TypeScript, MIT.
>
> ⭐ https://github.com/Sillkiin/gmail-mcp

Tag relevant accounts only where genuinely appropriate; don't spam mentions.

---

## 5. dev.to / blog post (optional, evergreen)

**Title:** Building a read-only Gmail MCP server for structured data extraction

Outline:
1. The pain: manual copy-paste from email.
2. Why MCP + why keep the server thin (model does the reasoning).
3. The four tools and one design decision (read-only by default).
4. How to set it up in 5 minutes.
5. What's next (attachments, npx).

Cross-post the canonical URL back to the repo.

---

## Checklist before you post anywhere
- [ ] Demo GIF is at the top of the README and loads fast (<5 MB).
- [ ] Quick start actually works from a clean clone (test it).
- [ ] README has no leftover TODOs in the setup steps.
- [ ] You can answer "is my email data safe?" in one sentence (yes: read-only, local, your OAuth).
- [ ] Respond to every comment for the first 24h — engagement is what sustains reach.
