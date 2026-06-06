# Recording the demo GIF

A 15–25 second GIF at the top of the README is the single highest-leverage thing
for getting stars. People decide whether to star an MCP server in the first few
seconds, and "I can see it working" beats any amount of prose.

## What to show
The "wow" is: *plain-language request → Claude calls the tools → a clean table of
data extracted from real emails.* Keep it to one shot, no setup screens.

## Setup before recording
1. Finish the README Quick start so `gmail` shows up in Claude Desktop.
2. Use a **demo Gmail account** (or a label with non-sensitive emails). Never show
   private mail in a public GIF.
3. Put a handful of realistic emails under one label, e.g. `demo-sales`
   (a few fake "company X wants a demo" messages).
4. Set the client window narrow (~900px) so text is readable in a GIF.

## The script (one take)
1. Start with the chat empty and the `gmail` tools visible.
2. Type and send exactly:
   > Find everything in `label:demo-sales` from the last 90 days and make a
   > markdown table with columns: company, contact email, and what they want.
3. Let it run. The viewer should see the tool calls happen:
   - `search_emails` → `read_emails_batch`
4. Stop recording once the finished table renders.

Total on-screen time: aim for under 25 seconds. Trim the "thinking" pause.

## Recording tools
- **Windows:** [ScreenToGif](https://www.screentogif.com/) (free, crops + exports GIF directly).
- **macOS:** [Kap](https://getkap.co/) or `⌘⇧5` then convert to GIF.
- Keep the file **under ~5 MB** so it loads fast on GitHub. 12–15 fps is plenty.

## Add it to the README
1. Save as `docs/demo.gif`.
2. Replace the placeholder note at the top of `README.md` with:
   ```markdown
   ![gmail-mcp demo](docs/demo.gif)
   ```
3. Commit and push — the GIF renders inline on the repo page.

## Optional: a static fallback
Also export one clean PNG of the final table as `docs/demo.png`. Some places
(npm, social cards) don't animate GIFs; a still gets the point across.
