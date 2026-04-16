@AGENTS.md

# FPL Fixture Preview — Brand & Development Guidelines

## Brand Identity

This app is a companion tool to the official **Fantasy Premier League** website.
All design decisions must respect and reinforce the FPL brand. When in doubt,
defer to how the official FPL site (fantasy.premierleague.com) handles it.

---

## Colour Palette

These values are non-negotiable. Never introduce new primary colours without
explicit approval.

| Token | Hex | Usage |
|-------|-----|-------|
| `--fpl-bg-deep` | `#37003c` | Nav bar, header, always-dark surfaces, buttons |
| `--fpl-bg-main` | `#2d0039` | Page content background (dark mode) |
| `--fpl-bg-sidebar` | `#240030` | Left sidebar background (dark mode) |
| `--fpl-bg-surface` | `#1a0022` | Table headers, bench section, cards (dark mode) |
| `--fpl-accent` | `#00ff87` | Electric green — CTA highlights, active states, accent labels |
| Pitch stripe A | `#1a7a3c` | Dark green pitch stripe |
| Pitch stripe B | `#1e8a44` | Light green pitch stripe |
| Ad board | `#04a5c8 → #00cfff` | Cyan gradient on "Fantasy" advertising boards |
| FDR 1 | `#15803d` | Very Easy fixture (dark green) |
| FDR 2 | `#4ade80` / text `#14532d` | Easy fixture (light green) |
| FDR 3 | `#fde047` / text `#713f12` | Medium fixture (yellow) |
| FDR 4 | `#fb923c` | Hard fixture (orange) |
| FDR 5 | `#dc2626` | Very Hard fixture (red) + glow `rgba(220,38,38,0.6)` |

All colours are exposed as CSS custom properties in `src/app/globals.css`.
Light mode overrides exist under `html.light { }` and swap surface colours to
lavender tones while keeping `#37003c` and `#00ff87` as brand anchors.

---

## Typography

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Display / headings | **Barlow Condensed** (`--font-barlow`) | 700, 800 | Team names, GW numbers, "Pick Team" heading, player name chips on pitch, stat values in sidebar |
| Body / UI | **Geist** (`--font-geist-sans`) | 400, 600 | Labels, table cells, descriptions, form inputs |
| Mono | **Geist Mono** (`--font-geist-mono`) | 400 | Code, debug output only |

Apply display font via `style={{ fontFamily: "var(--font-barlow)", fontWeight: 800 }}`.
**Never** use Barlow Condensed on table body cells, paragraph text, or tooltips body copy.

---

## Component Design Rules

### Pitch View (`PitchView.tsx`, `PlayerPitchCard.tsx`)
- Jersey image proportions are **fixed** — do not resize kit images.
- Kit image sizes: `64×58px` (mobile) / `76×68px` (sm+).
- Card width: `84px` (mobile) / `96px` (sm+).
- Player name chip: `bg-[#37003c]`, white text, Barlow Condensed 800, 13px.
- C/V badge: absolute `top-0 left-0`, 20×20px circle overlaid on kit.
- Pitch rows animate on mount/GW-change using CSS classes `pitch-row pitch-row-{position}`.
  Delays: FWD 100ms → MID 250ms → DEF 400ms → GK 550ms → bench 700ms.
- Hover tooltip: appears on `group-hover` for **starters only** (not bench).
  Uses `bg-[#37003c]` + `border-t-2 border-[#00ff87]`, positioned `bottom-full`.
- Pitch background is split into two layers:
  - **Background layer** (`overflow-hidden rounded-t-xl`) — clips pitch stripes and ad boards.
  - **Player layer** (`overflow-visible z-10`) — allows tooltips to escape the pitch boundary.
- `key={selectedGwIndex}` on the player layer div re-triggers CSS animations on GW change.

### Fixture Grid (`FixtureGrid.tsx`, `PlayerRow.tsx`)
- Sticky columns (Pos, Player, Pts/Form) always cast a rightward shadow:
  `boxShadow: "4px 0 16px rgba(0,0,0,0.45)"` on the Pts/Form `<th>` and `<td>`.
- FDR 5 cells get an additional red glow via `fdrGlowStyle(fdr)` from `FdrLegend.tsx`.
- Current GW column header: accent colour `var(--fpl-accent)`.

### Transfer Recommendations (`TransferRecommendations.tsx`)
- Each card has a 3px full-width strength bar at the very top (inside `rounded-xl`):
  - Score ≥ 70 → `#ef4444` (urgent / red)
  - Score 40–69 → `#f59e0b` (moderate / amber)
  - Score < 40 → `#00ff87` (opportunistic / green)
- OUT cards: `rgba(239,68,68,0.08)` bg, `rgba(239,68,68,0.25)` border.
- IN cards: `rgba(34,197,94,0.08)` bg, `rgba(34,197,94,0.25)` border.
- Reason bullets use `✓` in `#00ff87`.

### Sidebar (`TeamSidebar.tsx`)
- Team identity block always uses `bg-[#37003c]` regardless of light/dark mode.
- Stats section: `pl-5 pr-8` to give number values breathing room from the right edge.
- FDR legend is hidden on mobile (`hidden lg:block`).

### Tab Toggle (`TeamTabs.tsx`)
- Three tabs: Pitch View / Fixture Grid / Transfers.
- Active tab: `bg-[#37003c]` + white text. Inactive: transparent + `var(--fpl-muted)`.
- Transfer tab shows a count badge when recommendations > 0; badge is `#00ff87` when active.

---

## CSS Architecture

All theme tokens live in `src/app/globals.css` using native CSS custom properties.
Tailwind v4 is used (`@import "tailwindcss"` — **not** `tailwind.config.js`).

**Do not** hardcode colours inline when a CSS variable exists.
**Do** use `style={{ color: "rgb(var(--fpl-text))" }}` for opacity compositing.
**Do** use `style={{ color: "var(--fpl-muted))" }}` for muted/secondary text.

Keyframe animations are defined in `globals.css` as plain CSS — no animation
libraries. The pitch entrance animation uses `@keyframes pitch-row-in`.

---

## Architecture Constraints

- All FPL API calls are proxied through Next.js API routes (CORS restriction):
  - `GET /api/fpl/bootstrap` → bootstrap-static (1h revalidate)
  - `GET /api/fpl/fixtures` → fixture list (1h revalidate)
  - `GET /api/fpl/entry/[teamId]` → manager/team info
  - `GET /api/fpl/picks/[teamId]/[gw]` → squad picks for a GW
- Server-side data assembly lives entirely in `src/lib/fpl.ts → buildSquadRows()`.
- **Never** fetch FPL API directly from client components.
- `NEXT_PUBLIC_BASE_URL` or `VERCEL_URL` constructs the internal fetch base URL.

---

## Key Files

| File | Purpose |
|------|---------|
| `src/types/fpl.ts` | All FPL API + view-model types |
| `src/lib/fpl.ts` | Data fetching, transformation, transfer recommendations |
| `src/app/globals.css` | CSS variables, keyframe animations, Tailwind import |
| `src/app/layout.tsx` | Font loading (Geist + Barlow Condensed) |
| `src/app/page.tsx` | Home page — team ID input |
| `src/app/team/[teamId]/page.tsx` | Team page — server component, two-column layout |
| `src/components/ThemeProvider.tsx` | Dark/light mode context + `html.light` class toggle |
| `src/components/ThemeToggle.tsx` | Switch toggle button in nav bar |
| `src/components/TeamSidebar.tsx` | Left panel — team identity + stats + FDR legend |
| `src/components/TeamTabs.tsx` | Tab switcher (client) — Pitch / Grid / Transfers |
| `src/components/PitchView.tsx` | Formation pitch layout + bench |
| `src/components/PlayerPitchCard.tsx` | Individual player card on pitch (kit + tooltip) |
| `src/components/FixtureGrid.tsx` | Scrollable fixture difficulty table |
| `src/components/PlayerRow.tsx` | Table row per player |
| `src/components/FdrLegend.tsx` | `fdrClass()` + `fdrGlowStyle()` helpers + legend |
| `src/components/TransferRecommendations.tsx` | Transfer suggestion cards |

---

## FPL Data Notes

- Current GW: `bootstrap.events.find(e => e.is_current)`
- Fixture range shown: currentGw → GW38
- Squad positions 1–11 = starters, 12–15 = bench (from `pick.position`)
- Kit image URL pattern: `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_{teamCode}{suffix}-110.png`
  where suffix is `_1` for goalkeepers.
- Transfer recommendations are computed server-side in `buildSquadRows()` using the
  existing fixture map — zero extra API calls.

---

## What NOT to Do

- Do not change jersey sizes or proportions.
- Do not install animation libraries (framer-motion, GSAP, etc.) — use CSS keyframes.
- Do not add new primary colours to the palette.
- Do not apply Barlow Condensed to table body cells or paragraph text.
- Do not fetch the FPL API directly from client components.
- Do not modify `lib/fpl.ts` data logic when working on UI changes.
- Do not use `tailwind.config.js` — this project uses Tailwind v4 (`@import "tailwindcss"`).
