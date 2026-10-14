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

## Approved Figma redesign (2026-10-14)

- User-approved latest Figma desktop section `160:513424` in file `QqivWPbFJvHActUdOKBCxM` supersedes the older green/sidebar design. Implement the source screenshots and native layer geometry recorded in `../.design/figma-implementation-20261014/implementation-plan.md` and linked reference directories.
- Current brand: iris `#6154D9`, white `#FFFFFF`, canvas `#F7F8FA`, ink `#202124`, muted `#686B73`, border `#E8E9EE`, soft `#F0EDFC`. Use the approved connected i/p symbol and system Korean font stack.
- Desktop header is80px high, content aligns with page containers; home/search max1280px with28px horizontal insets. Support/account header controls align to their main reading column, as in the reviewed Figma header alignment.
- Mobile should not repeat an ITPLACE wordmark or membership label in the upper-left. Preserve safe areas, accessible controls, and responsive navigation.
- Implement visual layers in reusable React/CSS components. Keep existing API, auth, map and persistence contracts. Static prototype demo accounts, verification codes and store snapshots must not become production behavior.
- No trial/experience entry. Login recovery links and signup precede the login submit button.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
