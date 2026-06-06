# Contributing to gmail-mcp

Thanks for helping improve gmail-mcp.

## Ground rules
- **Never commit secrets.** `credentials.json`, `token.json`, and the `~/.gmail-mcp`
  directory are git-ignored. Double-check `git status` before committing.
- Keep the server **read-only** unless a change is explicitly discussed in an issue —
  the read-only guarantee is a core promise of this project.
- Keep tools small and well-described; the tool `description` is what the client model
  reads to decide when to call it, so make it precise.

## Dev setup
```bash
npm install        # builds via prepare
npm run build      # recompile after changes
```

Verify the server still speaks MCP after a change by connecting it to Claude Desktop or
Cursor (see README), or by sending a JSON-RPC `initialize` + `tools/list` over stdio.

## Pull requests
1. Describe the change and the motivation.
2. Note any new OAuth scopes — **adding a write scope is a breaking trust change** and
   needs discussion first.
3. Confirm `npm run build` passes and you tested against a real (test) Gmail account.

## Reporting issues
Open an issue with: what you asked the model to do, which tool was called, and (secrets
redacted) any server stderr output.
