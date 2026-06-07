# Publishing to npm

Publishing is **optional** — the server already runs via `npx github:Sillkiin/gmail-mcp`
without npm. Publishing to npm just enables the shorter `npx gmail-mcp`.

Everything is prepared:
- `bin` → `gmail-mcp` maps to the built server.
- `files` ships only `dist`, `README.md`, `LICENSE`.
- `prepublishOnly` runs `build` + `test`, so a broken build can't be published.
- `publishConfig.access` is `public`.
- A tag-triggered GitHub Actions release workflow (`.github/workflows/release.yml`).

## Option A — automated (recommended)

1. Create an **npm automation token**: npmjs.com → Access Tokens → Generate → *Automation*.
2. Add it to the repo: **Settings → Secrets and variables → Actions → New repository secret**,
   name `NPM_TOKEN`.
3. Bump the version and push a tag:
   ```bash
   npm version patch        # or minor / major — creates a commit + git tag
   git push --follow-tags
   ```
4. The `Release` workflow builds, tests, and runs `npm publish` with provenance.

## Option B — manual

```bash
npm login
npm version patch
npm publish        # prepublishOnly runs build + test first
git push --follow-tags
```

## After publishing

Users can then run:
```bash
npx gmail-mcp
```
and reference `gmail-mcp` (instead of the full `node dist/src/index.js` path) in their MCP
client config.

## Notes
- The package name `gmail-mcp` must be available on npm (or use a scoped name like
  `@sillkiin/gmail-mcp` — set it in `package.json` `name`).
- Provenance requires the public-repo + OIDC setup the workflow already declares
  (`id-token: write`).
