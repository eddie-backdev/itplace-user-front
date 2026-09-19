# User Front Next.js Agent Rules

Applies to the Next.js branch of `itplace-user-front`, including its linked worktree.

## Stack

- React 19
- TypeScript
- Next.js 16 App Router
- npm / package-lock

## Default workflow

- Keep edits inside this repo unless the task explicitly spans multiple repositories.
- Avoid reverting unrelated local work already present in this repository.
- Prefer small, reviewable changes and reuse existing patterns before adding new abstractions.

## Verification

Run from this directory:

- `npx eslint . --config eslint.config.js`
- `npm run typecheck`
- `npm test`
- `npm run build`

## Commit / push

- Commit from this repo, not the workspace root.
- Inspect recent commit history before committing and match the repository style.
- Use scope-less Conventional Commit headers by default, e.g. `fix: 한글 요약`, `feat: 한글 요약`, `refactor: 한글 요약`.
- Write commit subjects and bodies in Korean by default; keep technical identifiers in English where appropriate.
- 커밋 본문에는 필요한 설명만 간결하게 남기고, `Constraint:`, `Tested:`, `Confidence:` 같은 Lore trailer는 사용자가 요청하지 않는 한 넣지 않는다.
- Do not add `Co-authored-by` unless explicitly requested.
- Workspace service helpers target the original Vite worktree. Run the checks above directly in this Next.js worktree.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
