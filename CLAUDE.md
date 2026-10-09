# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Claude-specific notes

- `AGENTS.md` (imported above) is the source of truth for commands, architecture, conventions and pitfalls — update it there rather than duplicating here.
- `videos/konbato-motion/` is a separate HyperFrames video project (launch film assets), not part of the Next.js app. It has its own `CLAUDE.md`/`AGENTS.md`; follow those when working inside it and keep it out of app changes.
- `app/tools/page.tsx` is the tools index; each sibling directory is one tool route.
- On Windows/PowerShell, the dev-server test variant is `$env:PW_DEV_SERVER = '1'; pnpm exec playwright test`.
