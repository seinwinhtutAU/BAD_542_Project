# Design System

Campus Health Appointment & Medicine Management System — frontend design contract.

## Stack

- framework: React 18 + Vite 5 (`frontend/`)
- routing: react-router-dom 6, nested routes under a per-role layout
- styling: **hand-written CSS with custom properties** in `frontend/src/index.css` — no Tailwind, no CSS-in-JS, no component library
- components: local only, in `frontend/src/components/`
- animation: CSS transitions and keyframes; no animation library
- icons: inline SVG (24×24 viewBox, `stroke="currentColor"`, `strokeWidth="2"`)

There is no `cn()` utility and no `tailwind.config` because there is no Tailwind. Styling is
applied through semantic class names; the token block below is the single source of truth.

## Tokens

Defined in `frontend/src/index.css` under `:root`. The palette is a clinical dark slate with
cyan and teal accents, and is deliberately single-theme (dark only).

| Group | Tokens |
|---|---|
| Surface | `--bg-main` `#090d16`, `--bg-surface`, `--bg-card`, `--bg-card-hover`, `--bg-elevated`, `--bg-glass` |
| Text | `--text-primary` `#f8fafc`, `--text-secondary`, `--text-muted` |
| Brand | `--primary` `#0284c7`, `--primary-light` `#38bdf8`, `--primary-dark`, `--primary-glow` |
| Accent | `--teal` `#0d9488`, `--teal-light`, `--ai-purple` `#a855f7` (AI features only) |
| Semantic | `--success`, `--warning`, `--danger`, each with a `-bg` and `-border` pair |
| Border | `--border-subtle`, `--border-focus`, `--border-glow` |
| Radius | `--radius-sm` 6px, `--radius-md` 10px, `--radius-lg` 16px, `--radius-xl` 24px, `--radius-full` |
| Shadow | `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-glow` |
| Spacing | `--space-1` 4px … `--space-7` 48px |
| Motion | `--transition-fast` 150ms, `--transition-normal` 250ms |

**Rule:** components use tokens only. No hardcoded hex in JSX, no inline `style={{ }}` for
anything the stylesheet can express.

## Layout

Primitive: **sidebar-main**.

| Width | Shell |
|---|---|
| ≥ 900px | Fixed 244px sidebar (brand, role sections, user + log out) beside the scrolling main column. Top navbar hidden. |
| < 900px | Top navbar (brand, user, log out) plus a fixed bottom navigation bar. Sidebar hidden. |
| < 700px | Data tables reflow into stacked cards, each cell labelled from `data-label`. |
| < 640px | Two-column page layouts collapse to one; stat grids go to a single column. |

## Decisions

- 2026-09-09 — init: React + Vite + plain CSS detected. **No Tailwind preset applied** — the
  project already has a complete custom-property token system, and the brief was explicitly to
  preserve the existing clinical dark theme. `DESIGN.md` documents the real stack instead.
- 2026-09-09 — phase 1: three role dashboards split into nested routes under per-role layouts,
  so every section has a real URL. Tab strips became `NavLink`s.
- 2026-09-09 — phase 2: tab strips replaced by the sidebar-main shell; inline styles moved into
  the stylesheet; spacing scale introduced; stat walls removed from the student and doctor pages
  in favour of a single context line; tables reflow to cards on phones.

## Components

| Component | Path | Notes |
|---|---|---|
| `AppShell` | `components/AppShell.jsx` | Sidebar + bottom nav + main column. Wraps all authenticated pages. |
| `Navbar` | `components/Navbar.jsx` | Mobile-only top bar (hidden ≥900px by CSS). |
| `PageHeader` | `components/PageHeader.jsx` | Page title, optional role badge, description. |
| `StatCard` | `components/StatCard.jsx` | Icon + figure + label. Admin pages only. |
| `EmptyState` | `components/EmptyState.jsx` | Icon, heading, body, optional action. |
| `Modal` | `components/Modal.jsx` | Escape to close, scroll lock, overlay click. |
| `Toast` | `components/Toast.jsx` | Rendered by `ToastProvider`; raise with `useToast()`. |
| `AlertBanner` | `components/AlertBanner.jsx` | Campus emergency alert from the peer API. |

## Non-Goals

- No Figma sync, no image generation.
- No light theme — the product is deliberately dark-only.
- No Tailwind or component library; do not introduce one without changing this file first.
