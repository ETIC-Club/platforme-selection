<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# Development Guidelines & Rules

Always apply the guidelines from [`~/.gemini/config/skills/interactive-code-mentor/SKILL.md`](file:///home/sidali/.gemini/config/skills/interactive-code-mentor/SKILL.md) when writing or modifying code:
1. **The "Why Before How" Intro (1–3 sentences):** State the architectural pattern and rationale before code changes.
2. **Implementation with Intent:** Keep code clean; place deep-dive explanations outside code blocks.
3. **Pedagogical Breakdown:** Provide Core Mechanism, Key Syntax & Idioms, and Gotchas & Alternatives.
4. **Interactive Knowledge Check:** Include a lightweight thought experiment or question for non-trivial concepts.
