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

## Shared shell visual tokens

- Follow the approved [X sidebar reference](https://x.com/thesamirho/status/2107056704588509298?s=20) for the floating white navigation panel, thin neutral border, 18px radius, and compact monochrome navigation. Use a cool-gray canvas, tidy white cards, and restrained accent color.
- Shared shell colors: canvas `#F6F7FA`, navigation and surfaces `#FFFFFF`, border `#E7EAF0`, ink `#252A34`, muted text `#69717E`; retain brand `#167A4C`, strong brand `#115C3A`, and soft brand `#EAF5F0` for primary actions. Active navigation uses muted gray `#F1F1EE` with dark ink. Use lavender `#F1EEFC` / `#6654A8`, mint `#EAF5F0`, and peach `#FFF2E9` sparingly for supporting accents.
- `--itplace-sidebar-width` is the total reserved width, including the panel and side insets: 276px at 1024px and wider (244px panel + 16px each side), 88px at 768–1023px (64px panel + 12px each side), and 96px when collapsed on desktop (64px panel + 16px each side). Main content offset must match this total. Below 768px, retain the existing mobile tabs.
- Keep desktop sidebar motion reversible at 240ms, preserve each navigation icon's center while labels fade and the rail changes width, and remove related transitions under `prefers-reduced-motion`.
- Use `.surface-card` for white cards with a 1px border, 20px radius, and subtle shadow (`0 2px 10px rgba(31, 38, 52, .035)`). Keep controls simple and rounded; avoid gradients, blur, and decorative motion.
- Workspace layouts use `.workspace-container` (max-width 2160px; horizontal padding 20/32/40/48px at 640/1024/1600px). Keep prose at a readable line length inside wider layouts.
- Tailwind `wide` and `ultrawide` breakpoints are 1600px and 2200px for large-screen layout changes; prefer these named breakpoints over arbitrary minimum-width variants.
- Use the existing system font stack and restrained 14–16px interface text.
- `/benefits` follows the approved compact brand-logo explorer design: neutral `#F5F5F7` canvas, white cards, `#1D1D1F` ink, `#6E6E73` secondary text, `#E5E5E8` borders, and restrained `#0066CC` selection/action accents scoped to this feature. Use original brand logos without colored backplates or product photography. Cards stay compact; desktop widths from 1280px pair the catalog with a right detail inspector, while narrower screens use the existing detail route. Follow the approved shared navigation tokens above.
- Desktop map layout keeps the global left navigation, a flexible `min-w-0` map canvas, and a right search/detail panel (356px base, 380px at `xl`, 400px at `wide`). Benefit details render inline in that panel; when collapsed, keep its subtree mounted but `inert` and `aria-hidden`. Preserve the existing mobile bottom sheet.
- Desktop map and search panel share 16px outer top/bottom/right insets and a 16px gap (12px at 768–1023px); keep the map category bar and controls compact, neutral, and keyboard-visible.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
