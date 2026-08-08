# ITPLACE Design

## Active design contract

- Status: Active — warm Korean consumer utility direction
- Last refreshed: 2026-08-08
- Thesis: 주변 혜택은 카드 더미가 아니라 지도 위에 도착하는 생활 정보처럼 읽힌다.
- This document is the implementation source of truth for active visual and interaction work. Confirm token values in `tailwind.config.js` and `src/index.css`, and confirm layout behavior in `src/components/Header.tsx`, `src/components/MobileAppTabBar.tsx`, and `src/features/mainPage/components`.

## Product and information architecture

- Primary jobs: 내 주변 혜택 찾기, 통신사·카테고리별 필터링, 브랜드·제휴처 검색, 상세 조건 확인, 관심 혜택 저장, 질문형 AI 추천 받기.
- Primary navigation:
  - Mobile: 홈, 지도, 혜택, 즐겨찾기, 마이.
  - Desktop: 지도, 전체 혜택, 즐겨찾기, 마이와 AI 추천·서비스 안내·인증 보조 액션.
- Core routes:
  - `/`: landing or mobile home
  - `/map`: map-based nearby benefit discovery
  - `/benefits`, `/benefits/partners/:partnerId/:partnerSlug`: all benefits and partner detail
  - `/login`: login, signup, and phone verification
  - `/mypage/info`, `/mypage/favorites`: profile and saved benefits
  - `/membership`, `/membership/:carrierSlug`: carrier membership guidance
  - `/about`, `/guide`, `/faq`, `/contact`: service support
  - `/terms`, `/privacy`, `/account-deletion`: policy and account guidance
- Information priority: location/search/filter context → nearby partner and highlighted benefit → carrier and distance → full conditions in detail.
- Location denial, empty results, slow networks, and API failures must always expose a clear recovery or alternate exploration action.

## Brand direction

- ITPLACE feels warm, practical, trustworthy, and lightly friendly: a Korean everyday utility, not a luxury, finance, crypto, or promotion-heavy service.
- Four vector brand-mark candidates live in `public/brand/itplace-mark-{a,b,c,d}.svg`. Option B is active: a segmented route surrounds a central place while two leaf-green benefit nodes create movement and locality. The desktop rail, browser favicon, install icon, and touch icon use this active mark.
- The desktop rail uses the background-free responsive cut `itplace-mark-b-rail.svg` so the mark shares the navigation surface instead of appearing as a detached icon tile. Browser and install icons retain the warm-ivory tile for legibility outside the product UI.
- Use refined matte surfaces, thin warm borders, compact information hierarchy, and restrained soft shadows.
- The map and benefit information lead. Illustration, decoration, and motion support empty states or guidance without competing with discovery.
- Empty and blocked states use one consistent flat 2D squirrel mascot: warm biscuit-beige fur, a deep-green map pouch, and restrained butter-yellow benefit accents. Keep the silhouette readable at 112–144px, vary only the pose or prop by state, and never embed UI copy in the artwork.
- Copy is friendly but factual. Benefit conditions take precedence over advertising language; buttons name the action directly.

## Color and tokens

| Role         | Token/value                              | Use                                                       |
| ------------ | ---------------------------------------- | --------------------------------------------------------- |
| Canvas       | `warmCanvas` / `#F9F8F5`                 | page background and quiet regions                         |
| Surface      | `warmSurface`, `white` / `#FFFEFB`       | panels, sheets, cards, controls                           |
| Brand        | `brand`, `success` / `#167A4C`           | primary action, selection, location and positive emphasis |
| Brand strong | `brandStrong`, `successDark` / `#115C3A` | hover/pressed states and high-contrast green text         |
| Brand soft   | `brandSoft` / `#EDF8F2`                  | selected background and subtle green emphasis             |
| Benefit      | `benefit`, `accentGold` / `#FFD75A`      | rare promotional badges; not nearby-card copy             |
| Ink          | `ink`, `black` / `#242321`               | primary text and icons                                    |
| Muted text   | `warmMuted` / `#6F6A60`                  | supporting copy                                           |
| Border       | `warmBorder` / `#E4E1D8`                 | dividers, card and control outlines                       |
| Navigation   | `warmNav` / `#F3F0E8`                    | desktop navigation rail                                   |
| Danger       | `danger` / `#D7263D`                     | errors and destructive actions only                       |

- `tailwind.config.js` is the Tailwind color source of truth; CSS-only surfaces use synchronized `--itplace-*` variables from `src/index.css`.
- `purple01` through `purple06` are compatibility aliases mapped to green values. They do not define a purple visual direction and must not justify new purple UI.
- Prefer semantic tokens for new work. Do not add component-level hex/rgb values when an active token exists.
- Pink and orange legacy names are not the brand direction; use role-based tokens such as `benefit` or `accentGold` when the meaning is valid.

## Typography, surfaces, and motion

- Font stack: `NanumBarunGothic`, `Apple SD Gothic Neo`, `Malgun Gothic`, `Helvetica Neue`, `Arial`, sans-serif.
- Titles are short and firm. Body and benefit conditions use the existing 150% line-height scale for Korean readability.
- Cards and controls use compact 12–16px radii; sheets and larger containers may use 20–24px radii.
- Default surfaces are matte, with 1px `warmBorder` outlines. Shadows stay soft and low-opacity, typically based on warm charcoal or deep green rather than colored glow.
- Motion communicates state or spatial change only. Hover lift and press feedback remain subtle; dragging and panel transitions preserve direct manipulation. Respect `prefers-reduced-motion` for non-essential movement.

## Shell and map experience

### Desktop (`md` and above)

- The application shell is an 88px fixed navigation rail, followed by a 356px nearby-benefit panel, then the flexible map.
- The rail uses `warmNav`, a thin right border, and icon-plus-label controls. Map, ticket, bookmark, and user icons match their destinations. The active item's icon alone turns deep green, grows slightly, and uses a heavier stroke without a filled surface or side marker; `aria-current` provides the semantic cue.
- The nearby panel owns search, nearby/favorites/AI modes, contextual guidance, compact results, and selected-store detail. It may collapse to give the map more space.
- Categories sit above the map as horizontal controls. Map controls and transient cards remain visually secondary to location and result context.
- The map fills the remaining viewport; avoid detached promotional card grids over it.
- Partner and numeric cluster markers use a mathematically circular badge with a short tapered tail layered behind it. Do not stretch one outline into both the badge and pointer; the resulting lower curve appears uneven at map scale.

### Mobile (below `md`)

- Keep search fixed at the top as the first discovery action.
- Render categories as a horizontally scrollable row over the map. Do not wrap them into multiple lines.
- The map is the base layer and must remain legible between the search controls and sheet.
- The benefit sheet is draggable with a 300px default height, a 430px intermediate snap point when available, and a viewport-bounded expanded state. Its top corners are 24px with a visible drag handle, thin border, and restrained upward shadow.
- The 64px bottom navigation is fixed, safe-area aware, and contains 홈, 지도, 혜택, 즐겨찾기, 마이. Transient dialogs and overlays may temporarily hide it to prevent conflicting controls.
- Position map controls above the current sheet and bottom-navigation offset; mobile interaction must not depend on hover.

## Nearby benefit cards and detail

- Nearby results are compact map companions, not standalone promotional cards.
- A nearby card contains, in order: logo, partner/store name, one representative benefit, carrier, and distance. Category or walking time may appear as quiet secondary metadata.
- Render the representative benefit as concise green text without a highlighter background. Reserve yellow for exceptional promotional badges outside the standard nearby-card rhythm.
- Selected cards use border, surface, and elevation changes in addition to color.
- Keep tier rules, usage limits, usage method, external links, and other full conditions in the detail view.
- In detail, group benefits by carrier. Show only carriers that have benefits; use a label for one carrier and equal compact tabs/pills for multiple carriers.
- If several grades share the same benefit copy, show the copy once and group the applicable grade badges. Keep the reading order: benefit name/type → applicable grade and key benefit → limits and usage method.
- Default to one column on mobile and two columns where desktop detail width permits. Long explanations may use a semantic disclosure while key benefit and applicable grade remain visible.

## Component and state rules

- Reuse `SearchBar`, `ActionButton`, `Modal`, `NoResult`, `MobileAppTabBar`, `MobileHeader`, and existing feature components before introducing a parallel primitive.
- Every interactive element covers default, hover where relevant, pressed, selected/active, `focus-visible`, disabled, loading, empty, error, and success states as applicable.
- Loading uses concise status text with a spinner or skeleton. Empty states pair a gentle explanation with a next action. Errors lead with recovery. Saved, removed, and authenticated actions return explicit feedback.
- Do not encode active or selected state by color alone. Pair color with a marker, border/surface change, icon weight, label, `aria-current`, or `aria-pressed` as appropriate.
- Policy and account-deletion routes retain stable, readable document layouts suitable for external review.

## Accessibility

- Target WCAG 2.1 AA. Body text must meet at least 4.5:1 contrast against its surface; do not use muted tokens where they fail this threshold.
- Buttons, links, tabs, search, disclosure controls, and modal close controls are semantic native controls and expose a visible `focus-visible` state.
- Use `aria-current` for the active route and `aria-pressed` or the appropriate tab semantics for toggled states. Form errors are programmatically connected to inputs.
- Location permission, map selection, loading, empty, and error states cannot be communicated by color or map graphics alone.
- Preserve keyboard access for authentication, navigation, filters, details, and overlays. Keep touch targets comfortably operable and account for the mobile safe area.

## Responsive and implementation constraints

- Standard breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`, `2xl: 1536px`; repository max-width aliases remain available for compatibility.
- Below 768px, use the mobile search/map/sheet/tab-bar composition. At 768px and above, use the rail/panel/map composition.
- React 19, TypeScript, Vite, and Tailwind CSS remain the implementation baseline.
- Kakao Maps SDK, large imagery, landing media, and large chunks can affect first load. Prioritize the code and data required for map and nearby-benefit discovery.
- After visual/token changes, run `npx eslint . --config eslint.config.js` and `npm run build`, then inspect both mobile and desktop map screens at representative viewport sizes.
