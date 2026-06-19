# Handoff: Telescope Requests — compact redesign

## Overview
A redesigned **Requests** view for a Laravel Telescope–style monitoring panel (project: *Synorga*). The goal of the redesign was to make the screen **more compact** and **surface more information per row** than stock Telescope, while keeping a clean, professional dev-tool feel.

It is a single-screen experience: a left watcher-navigation sidebar, a top toolbar, a filter form, a dense requests table, and a right-hand **detail slide-over** that opens when a row is clicked.

The target implementation is a **React app**, wired to the **real Telescope data/API** (see `TELESCOPE_API_MAPPING.md` for the exact entry → field mapping). The prototype currently runs on hard-coded mock data; that mock array documents the *shape* of a row, not the source of truth.

## About the Design Files
The files in this bundle (`Telescope Requests.dc.html`, `support.js`) are a **design reference created in HTML** — a prototype showing the intended look and behavior. **They are not production code to copy directly.** `support.js` is the prototype's own rendering runtime and is **not** part of the deliverable; do not port it.

Your task is to **recreate this design in the target React codebase** using its established patterns (component library, styling solution, data-fetching layer, router). Treat the HTML/inline-styles as a precise spec for layout, spacing, color and typography — re-express it in idiomatic React + whatever styling system the codebase already uses (CSS Modules, Tailwind, styled-components, etc.).

## Fidelity
**High-fidelity.** Colors, spacing, typography and interactions are final and intentional. Recreate the UI pixel-accurately. Exact values are in **Design Tokens** below and inline in the prototype.

## Tech context
- **Framework:** React.
- **Data:** real Telescope API. Telescope stores entries (type `request`) and exposes them at `/telescope/telescope-api/requests` (list) and `/telescope/telescope-api/requests/{id}` (detail). See `TELESCOPE_API_MAPPING.md`.
- **Fonts:** IBM Plex Sans (UI) + IBM Plex Mono (all numeric/code/path values). Load via Google Fonts or self-host.
- **Icons:** all icons in the prototype are inline SVG (Lucide-equivalent stroke icons, `stroke-width:2`). Use your icon library; names are noted per element below.

---

## Screen: Requests

### Layout
Full-viewport flex column, `background:#f4f4f5`, `color:#18181b`, `overflow:hidden`:

```
┌──────────────────────────────────────────────────────────┐
│ Header (height 52px, white, bottom border #ebebef)        │
├──────────┬───────────────────────────────────────────────┤
│ Sidebar  │ Main (flex column)                             │
│ 212px    │  • Title + summary stat cards                  │
│ white    │  • Filter form (search + chip groups)          │
│ right    │  • Saved views row                             │
│ border   │  • Table card (flex:1, scrolls x+y)            │
└──────────┴───────────────────────────────────────────────┘
   + Detail slide-over (fixed, right, 520px) overlays on row click
```

- Outer: `display:flex; flex-direction:column; height:100vh`.
- Body split: `display:flex; flex:1; min-height:0`.
- Main: `flex:1; min-width:0; display:flex; flex-direction:column`.
- Horizontal padding inside main is `18px`; the filter card and table card sit in that gutter.

### Component: Top header
- Container: `height:52px`, `background:#fff`, `border-bottom:1px solid #ebebef`, `padding:0 16px`, flex space-between.
- **Left cluster** (gap 10px): logo tile `26×26`, `border-radius:7px`, `background:linear-gradient(135deg,#6366f1,#8b5cf6)`, white `✦` glyph 15px. Then "Laravel Telescope" (14px / 600 / `-0.01em`), a `/` separator in `#a1a1aa`, then "Synorga" (13px / 500 / `#71717a`). *(Wordmark text is placeholder — use the app's brand.)*
- **Right cluster** (gap 6px):
  - **Live pill** — `padding:5px 9px`, `border-radius:7px`, `background:#f4f4f5`, 11.5px `#71717a`. Green dot `7×7` `#22c55e` with `box-shadow:0 0 0 3px #dcfce7`. Reflects polling state (see Live polling).
  - **Pause** icon button (`pause` icon) — toggles polling.
  - **Clear** icon button (`trash` icon) — clears collected entries (Telescope `DELETE /telescope/telescope-api/entries`).
  - **Refresh** icon button — primary style: `background:#6366f1`, white icon (`refresh-cw`). All icon buttons: `30×30`, `border-radius:7px`, `background:#f4f4f5` (primary uses indigo), `color:#52525b`, hover `#e9e9ee`.

### Component: Sidebar (watcher nav)
- `width:212px`, `background:#fff`, `border-right:1px solid #ebebef`, `padding:10px 10px 16px`, vertical scroll.
- Three section labels: **Watchers**, **Data**, **Diagnostics** — 10px / 600 / `letter-spacing:0.07em` / uppercase / `#a1a1aa`, padding `6px 8px 4px` (12px top for later sections).
- Nav item (`a`): flex, gap 9px, `padding:6px 8px`, `border-radius:7px`, 12.5px / 500, `color:#52525b`, 15px leading icon. Hover: `background:#f1f1f4; color:#18181b`.
- **Active** item ("Requests"): `background:#eef0fe; color:#4f46e5; font-weight:600`.
- Optional trailing **count badge**: 10px / 600, `padding:1px 6px`, `border-radius:20px`. Neutral counts use `color:#a1a1aa` (no bg); the active item uses `color:#6366f1; background:#e0e3fd`; the Exceptions item uses `color:#dc2626; background:#fee2e2` and the row text is `#dc2626`.
- Items (icon → label → optional count). Only **Requests** routes in this design; the rest are nav targets to wire to their own watchers:
  - Watchers: Requests `218` (active), Commands, Schedule, Jobs `12`
  - Data: Queries `3.4k`, Models, Cache, Redis, Logs
  - Diagnostics: Exceptions `7` (red), Dumps, HTTP Client, Mail, Notifications, Gates, Views
  - *(Counts are illustrative — bind to each watcher's entry count.)*

### Component: Title + summary stats
- Row: flex space-between, `padding:14px 18px 10px`.
- **Title** `Requests` — 17px / 700 / `-0.02em`. Subtitle below (`margin-top:2px`): 11.5px mono `#a1a1aa`, text = `"{filteredCount} of {totalCount} requests · last 3h"`.
- **Stat cards** (3, gap 10px): each `padding:6px 14px`, `border-radius:9px`, `background:#fff`, `border:1px solid #ebebef`, `min-width:78px`, flex column. Label 10px / 600 uppercase `#a1a1aa`; value 15px / 600 mono.
  - **Avg** — mean duration of the *filtered* set.
  - **p95** — 95th-percentile duration of the filtered set.
  - **Errors** — count of filtered rows with status ≥ 400. Value color `#b91c1c` when > 0, else `#15803d`.

### Component: Filter form
Container: flex, `gap:10px`, `flex-wrap:wrap`, `padding:8px 18px 10px`, `margin:0 18px`, `background:#fff`, `border:1px solid #ebebef`, `border-radius:11px`. Thin `1px × 22px` `#ebebef` dividers separate groups.

- **Search input** — `flex:1; min-width:200px`. `height:32px`, left `search` icon at 10px, text `padding-left:30px`, `border:1px solid #e4e4e8`, `border-radius:8px`, `background:#fafafb`, 12.5px **mono**. Placeholder `"Filter by path, route, tag…"`. Filters on path / route / user substring (case-insensitive).
- **Verb chips** (group, gap 5px): `GET POST PUT PATCH DELETE`. Inactive chip: `height:28px`, `padding:0 10px`, `border-radius:8px`, 11px / 600 **mono**, `border:1px solid #e4e4e8`, `background:#fff`, **text colored per verb** (see verb palette). Active chip: `background:#18181b; color:#fff; border:1px solid transparent`. Multi-select toggle. Hover (inactive): `border-color:#c7c7d1`.
- **Status chips** (group): `2xx 3xx 4xx 5xx`, each with a leading status dot (`7×7` round) and a trailing per-class **count** (10px, `opacity:0.65`). Same chip shape; inactive text `#52525b`. Active = dark fill. Multi-select.
- **Duration chips** (group, single-select): `All` / `≥100ms` / `≥500ms` / `≥1s` → min-duration threshold `0 / 100 / 500 / 1000` ms. Active = dark fill.
- **Clear** button — appears only when any filter is active (`hasFilters`). Text button, `x` icon, `color:#6366f1`, 11.5px / 600. Resets search + all chip groups.

### Component: Saved views row
- `padding:9px 18px 5px`, flex, gap 7px. Leading label **VIEWS** (10px / 600 uppercase `#c4c4cc`).
- View pills: `height:26px`, `padding:0 11px`, `border-radius:20px`, 11px / 600. Inactive: `border:1px solid #ececef; background:#fff; color:#71717a`. Active: `border:1px solid #c7c9fb; background:#eef0fe; color:#4f46e5`.
- Prototype presets: **Slow (≥500ms)**, **Errors only** (status 4xx+5xx), **Writes** (POST+PUT+PATCH). A trailing **+ New view** pill uses a dashed border `#d4d4d8`, `color:#a1a1aa`.
- In production these become **persistent, user-editable saved views** (see Behaviors to build).

### Component: Requests table
- Card: `flex:1`, `margin:6px 18px 16px`, `background:#fff`, `border:1px solid #ebebef`, `border-radius:11px`, `overflow:auto`. Inner wrapper `min-width:1060px` so the grid never collapses; it scrolls horizontally as one unit on narrow viewports.
- **Column grid** (header and every row share it exactly):
  `grid-template-columns: 52px minmax(220px,1fr) 60px 70px 56px 70px 132px 104px 74px 26px; gap:10px;`
  → Verb · Path · Status · Time · SQL · Memory · User · IP · When · chevron.
- **Header row**: `position:sticky; top:0`, `background:#fafafb`, `border-bottom:1px solid #ebebef`, `padding:9px 16px`, labels 10px / 600 uppercase `#a1a1aa`. Numeric columns (Time/SQL/Memory/When) are right-aligned.
- **Data row** (`.tsrow`): `height:38px`, `padding:0 16px`, `border-bottom:1px solid #f4f4f6`, `cursor:pointer`. Hover `background:#f7f7fb`. Selected row `background:#eef0fe`.
  - **Verb badge**: `min-width:42px; height:20px; border-radius:5px`, 10.5px / 600 mono, colored per verb palette.
  - **Path cell**: mono 12.5px / 500 `#27272a` (path, `max-width:340px`, ellipsis, never shrinks below the route) + muted route/controller 10.5px `#b4b4bc` (shrinks/ellipsis first). Empty route shows `—`.
  - **Status badge**: `min-width:34px; height:20px; border-radius:5px`, 10.5px / 600 mono, colored per status-class palette.
  - **Time**: mono 12px / 500. Color by threshold — `≥1000ms #b91c1c`, `≥500ms #b45309`, else `#3f3f46`. Format: `<1000` → `"{n}ms"`, else `"{n/1000, 2dp}s"`.
  - **SQL**: mono 11.5px. `≥50 → #b45309`, else `#71717a`. `0 → "—"`.
  - **Memory**: mono 11.5px `#71717a` (e.g. `"284 MB"`).
  - **User**: avatar (`20×20` round, initials, hashed color — see Avatar) + name 11.5px `#52525b` (ellipsis). Guest = gray; API/service tokens render a `·` glyph in violet.
  - **IP**: mono 11px `#a1a1aa`.
  - **When**: 11px `#a1a1aa`, right-aligned relative time (`"9s ago"`).
  - **Chevron**: `chevron-right` 14px `#c4c4cc`, centered.
- **Empty state**: when no rows match, `padding:60px`, centered 13px `#a1a1aa`, `"No requests match these filters."`.

### Component: Detail slide-over
Opens on row click; closes on the X button or backdrop click.
- **Backdrop**: `position:fixed; inset:0; background:rgba(24,24,27,0.28)`, fade-in 0.15s.
- **Panel** (`aside`): `position:fixed; top:0; right:0; bottom:0; width:520px; max-width:92vw`, `background:#fff`, `border-left:1px solid #ebebef`, `box-shadow:-12px 0 40px rgba(24,24,27,0.12)`, fade/slide in ~0.18–0.22s (`cubic-bezier(.32,.72,0,1)`), `z-index:50`, flex column.
- **Head** (`padding:16px 18px 14px`, bottom border): eyebrow "REQUEST DETAIL" (10px / 600 uppercase `#a1a1aa`) + close button (`28×28`, `x` icon, `background:#f4f4f5`). Then verb badge + path (mono 14px / 600, `word-break:break-all`). Route line below (11.5px mono `#a1a1aa`).
- **Metric grid** (`3×2`, gap 8px): Status / Duration / Memory / SQL queries / DB time / When. Each tile `padding:9px 11px`, `border-radius:9px`, `background:#fafafb`, `border:1px solid #f0f0f3`; label 9.5px / 600 uppercase `#a1a1aa`, value 15px (When 13px) / 600 mono. Status value uses status-class text color.
- **Who** card: `38×38` avatar + name (13px / 600) + meta line (11px mono `#a1a1aa`; `"Unauthenticated"` for guests, `"Token auth"` for API, else `"user #{id} · {role}"`); right-aligned IP block.
- **Request headers** block: section label (11px / 600 uppercase `#71717a`) + bordered list, each row `grid 140px 1fr`, mono 11px, key `#a1a1aa`, value `#3f3f46` (`word-break:break-all`).
- **SQL queries** block: section label + `"{count} · {dbTime}"` summary. Each query is a **dark code card**: `background:#0f0f12`, `border:1px solid #1c1c22`, `border-radius:9px`, `padding:9px 11px`. Top row: connection name (9.5px / 600 uppercase `#71717a`) + time (10.5px mono; `≥80ms → #f59e0b`, else `#71717a`). Body: mono 11px `#d4d4d8`, `line-height:1.5`, `word-break:break-word`. No queries → single muted card.

---

## Interactions & Behavior

### Already in the prototype
- **Row click** → set `selectedId`, open slide-over. **X / backdrop click** → clear selection, close.
- **Search** filters live on path/route/user substring.
- **Verb chips / status chips** = multi-select toggles; **duration chips** = single-select threshold.
- **Saved-view presets** apply combinations of the above and toggle off if re-clicked.
- **Clear** resets all filters; appears only when something is active.
- Summary stats (Avg / p95 / Errors) and the `"{n} of {m}"` label recompute from the **filtered** set.
- Hover states on rows, nav items, icon buttons, chips.
- Animations: backdrop fade 0.15s ease; panel entrance ~0.18–0.22s.

### Behaviors to build (requested — not yet functional in the prototype)
1. **Live polling + Pause** — poll the requests endpoint on an interval (Telescope default is 1s) and prepend new entries. The header **Live** pill shows green/animated while polling; the **Pause** button stops/resumes and swaps to a play icon when paused. Stock Telescope behavior: pause when the user scrolls down / has a row open, resume at top.
2. **Saved views — persistent & editable** — let users create, name, edit and delete views (a view = the full filter set: search + verbs + statuses + min-duration, and later column visibility). Persist to localStorage and/or a user-settings endpoint. The **+ New view** pill captures the current filter set.
3. **Column chooser** — a control (e.g. a button at the right of the table header or in the toolbar) to toggle column visibility and ideally reorder. Persist the choice. Columns: Verb, Path, Status, Time, SQL, Memory, User, IP, When (Verb + Path should stay mandatory). The grid-template must be rebuilt from the visible set.
4. **URL state** — reflect all filters (search, verbs, statuses, minDuration, selected view, open request id) in the querystring so views are shareable/bookmarkable and survive reload. Initialize state from the URL on load.
5. **Dark mode** — full dark variant. The SQL code cards are already dark (`#0f0f12`); extend a dark theme across surfaces. Suggested mapping in Design Tokens. Drive via a theme toggle + `prefers-color-scheme`, persisted.

---

## State Management
Prototype state (lift into your store / hooks / URL as appropriate):
- `search: string`
- `verbs: string[]` — active verb filters (`GET`…`DELETE`)
- `statuses: string[]` — active status classes (`"2xx"`…`"5xx"`)
- `minDuration: number` — ms threshold (0/100/500/1000)
- `selectedId: number | null` — open request (drives the slide-over)
- *(to add)* `savedViews`, `activeViewId`, `visibleColumns`, `isPolling`, `theme`

Derived (memoize): `filtered` list, `avg`, `p95`, `errorCount`, per-status counts for chips, `hasFilters`.

Data fetching: list endpoint for the table (+ polling), detail endpoint lazily when a row opens. See `TELESCOPE_API_MAPPING.md`.

---

## Design Tokens

### Colors — surfaces & text
| Token | Hex |
|---|---|
| App background | `#f4f4f5` |
| Card / panel surface | `#ffffff` |
| Subtle surface (header row, tiles, input) | `#fafafb` |
| Border (primary) | `#ebebef` |
| Border (inputs/chips) | `#e4e4e8` |
| Border (faint, inside panel) | `#f0f0f3` / `#f4f4f6` |
| Text primary | `#18181b` |
| Text strong (path) | `#27272a` |
| Text secondary | `#52525b` / `#3f3f46` |
| Text muted | `#71717a` |
| Text faint / placeholder | `#a1a1aa` |
| Text faintest (labels) | `#b4b4bc` / `#c4c4cc` |

### Colors — accent (indigo)
| Token | Hex |
|---|---|
| Primary | `#6366f1` |
| Primary deep (active text) | `#4f46e5` |
| Primary tint bg (active nav/row/view) | `#eef0fe` |
| Primary badge bg | `#e0e3fd` |
| View active border | `#c7c9fb` |
| Logo gradient | `#6366f1 → #8b5cf6` |
| Chip active fill | `#18181b` (dark, not indigo) |

### Colors — HTTP verb (text, badge-bg)
| Verb | Text | Badge bg |
|---|---|---|
| GET | `#3f3f46` | `#f1f1f4` |
| POST | `#1d4ed8` | `#dbeafe` |
| PUT | `#b45309` | `#fef3c7` |
| PATCH | `#b45309` | `#fef3c7` |
| DELETE | `#b91c1c` | `#fee2e2` |

### Colors — status class (text, bg, dot)
| Class | Text | Bg | Dot |
|---|---|---|---|
| 2xx | `#15803d` | `#dcfce7` | `#22c55e` |
| 3xx | `#4f46e5` | `#e0e7ff` | `#6366f1` |
| 4xx | `#b45309` | `#fef3c7` | `#f59e0b` |
| 5xx | `#b91c1c` | `#fee2e2` | `#ef4444` |

### Colors — thresholds
- Duration text: `≥1000ms → #b91c1c`, `≥500ms → #b45309`, else `#3f3f46`.
- SQL count text: `≥50 → #b45309`, else `#71717a`.
- Error stat: `>0 → #b91c1c`, else `#15803d`.
- Query time (panel): `≥80ms → #f59e0b`, else `#71717a`.

### Avatar (user) colors
Guest → text `#a1a1aa` / bg `#f1f1f4`. API/service → text `#7c3aed` / bg `#ede9fe`. Otherwise hash the name to pick from: `[#0369a1/#e0f2fe, #15803d/#dcfce7, #b45309/#fef3c7, #9333ea/#f3e8ff, #be123c/#ffe4e6]`. Hash: `h=(h*31 + charCode)>>>0` over the name, index `h % palette.length`. Initials = first letters of first two words, uppercased.

### Typography
- **UI font:** `'IBM Plex Sans', system-ui, sans-serif`.
- **Mono font:** `'IBM Plex Mono', monospace` — used for all paths, numbers, IPs, code, durations, and the search input.
- Sizes used: 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 14, 15, 17 px. Weights: 400/500/600/700.
- Notable: page title 17/700/`-0.02em`; section labels 10/600/uppercase/`0.05–0.07em`; row text 11.5–12.5px; stat values 15/600.

### Radius
`5px` badges · `7px` icon buttons / nav items / logo · `8px` input & chips · `9px` stat cards / tiles / code cards · `11px` filter & table cards · `20px` count badges & view pills · `50%` avatars & dots.

### Shadow
- Slide-over: `-12px 0 40px rgba(24,24,27,0.12)`.
- Live dot ring: `0 0 0 3px #dcfce7`.
- Cards use borders, not shadows.

### Spacing
Page gutter `18px`. Card inner padding `8–16px`. Grid/flex gaps: `5px` (chip groups), `6–10px` (clusters), `10px` (table columns & stat cards). Row height `38px`; header bar `52px`; sidebar `212px`; slide-over `520px`.

### Suggested dark-mode mapping (to build)
App bg `#0f0f12` · surface `#18181b` · subtle `#1c1c22` · border `#27272a` · text primary `#f4f4f5` · secondary `#a1a1aa` · keep accent indigo `#6366f1`/tint `#312e81`-ish. Verb/status badges: dim the bg (~12–18% alpha of the dot color) and lighten text one step. The SQL code cards already match dark and can stay.

---

## Assets
- **No raster assets / images.** All icons are inline stroke SVGs (Lucide-equivalent: `code-2`-ish for Requests, `pause`, `trash`, `refresh-cw`, `search`, `x`, `chevron-right`, `database`, `mail`, `bell`, `eye`, etc.). Swap for your icon library.
- **Fonts:** IBM Plex Sans + IBM Plex Mono (Google Fonts).
- **Logo:** placeholder gradient tile + glyph — replace with the real Synorga/Telescope mark.
- Avatars are generated (initials + hashed color), not images — though you can swap in real Gravatar/user images.

## Files in this bundle
- `Telescope Requests.dc.html` — the prototype (design reference). Markup uses inline styles; the `<script>` logic class documents all filtering/derivation logic and the mock data shape.
- `support.js` — prototype runtime only; **do not port**.
- `screenshots/01-list.png` — full list view.
- `screenshots/02-detail-panel.png` — detail slide-over open.
- `screenshots/03-filtered.png` — search filter applied.
- `TELESCOPE_API_MAPPING.md` — how each UI field maps to Telescope entry data + endpoints.
