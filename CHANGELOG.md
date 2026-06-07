# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-06-07

First public release.

### Added
- MCP server (stdio transport) exposing **read-only** Gmail access.
- Seven tools:
  - `search_emails` — search with structured filters (`from`, `to`, `subject`,
    `label`, `newer_than`, `after`, `before`, `has_attachment`, `is_unread`) and/or
    a raw `query`, combined into one Gmail query.
  - `read_email` — one message in full with decoded plain-text body.
  - `read_emails_batch` — up to 50 messages at once for table extraction.
  - `get_thread` — read an entire thread in order.
  - `list_attachments` — attachment metadata without downloading bytes.
  - `get_attachment` — download attachment bytes (Base64URL).
  - `list_labels` — list labels to scope searches.
- One-command onboarding: `npm run setup` (credentials check + browser OAuth).
- Zero-clone install via `npx github:Sillkiin/gmail-mcp`.
- Pure, unit-tested parsing (`src/parse.ts`) and query building (`src/query.ts`);
  16 fixture-based tests, run in CI on every push.
- GitHub Actions CI (build + test) and a tag-triggered npm release workflow with
  provenance.
- Read-only `gmail.readonly` scope — the server cannot send, delete, or modify mail.

[Unreleased]: https://github.com/Sillkiin/gmail-mcp/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Sillkiin/gmail-mcp/releases/tag/v0.1.0
