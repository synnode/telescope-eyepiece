# Roadmap

Eyepiece ports 18 Telescope entry types plus Dumps and Monitored Tags. Most screens reuse the same primitives — a paginated table on the index, a slide-over drawer on the show. Only a handful diverge meaningfully.

## Status

All 20 routes are live. The app shell, primitives, and every watcher screen are in place; what's left is polish.

## Phase 1 — shared primitives ✓

Built to the design spec in `design_handoff_telescope_requests/`. Live in `resources/js/`:

- App chrome — `components/Header.tsx`, `components/Sidebar.tsx`, `components/Logo.tsx`. Header has the live-polling pill, pause/clear/refresh icon buttons, and a hamburger that toggles the sidebar drawer on mobile.
- `components/EntryTable.tsx` — generic grid-based list, sticky header, threshold-colored cells, sortable column config, empty state, cursor-paginated "Load more" footer.
- `components/EntryDetailDrawer.tsx` — slide-over panel anchored to the right, 520px wide, opens when the URL has `?id=`, Escape closes.
- `components/MetricGrid.tsx`, `OutcomeBadge.tsx`, `VerbBadge.tsx`, `StatusBadge.tsx`, `LevelBadge.tsx`, `Avatar.tsx`.
- Design tokens — `resources/js/styles.css` CSS variables (colors, typography with IBM Plex Sans + Mono, radii, verb / status palettes). Light theme.
- `lib/api.ts` — typed wrappers for every `/telescope-api/*` endpoint, prefixed by `getTelescopePath()`.
- `lib/useEntryList.ts` — first-page polling + Load-more cursor pagination, used by every list screen.
- `lib/format.ts` — duration / memory / relative time / percentile / status class.

## Phase 2 — screen ports ✓

Each screen lives at `resources/js/screens/<Name>.tsx`. Type-specific drawer bodies in `screens/<name>/<Name>DetailBody.tsx` where the detail view is rich enough to warrant a separate file.

- Requests, Queries, Exceptions, Logs, Jobs, Commands, Mail
- Cache, HTTP Client, Notifications, Events, Gates, Models, Redis, Views, Schedule, Batches

Routes are wired in `resources/js/App.tsx`; sidebar entries in `components/Sidebar.tsx`.

## Phase 3 — the screens that don't fit the mold ✓

- **Mail preview** — body rendered via `<iframe src={api.mail.previewUrl(id)} sandbox="allow-same-origin">`. `.eml` download link in the section header.
- **Exceptions stack trace** — `content.line_preview` is a `{ line: text }` map (not pre-rendered HTML as originally assumed); rendered as plain mono with the error line highlighted via background color. No syntax highlighter dependency. PUT resolve flow is wired.
- **Dumps** — single-pane list, each entry is a card containing Symfony's HtmlDumper output via `dangerouslySetInnerHTML`. 2s polling doubles as the dump-watcher cache heartbeat; a warning banner shows when the cache status comes back as `wrong-cache`.
- **Monitored Tags** — dedicated CRUD screen under a new "Settings" sidebar section, with react-query mutations.

## Known limitations / Phase 4 polish

Items that exist in the design or upstream Telescope but were deferred:

- **SQL count column on Requests** — shows `—`. Telescope's list endpoint doesn't return batch siblings; would need either an N+1 fetch per row or a custom aggregate endpoint in Eyepiece.
- **Sidebar counts** — count slots exist on every nav item but are unbound (no totals endpoint).
- **Saved views** — only the three presets (Slow / Errors only / Writes) are shipped. The "+ New view" pill, persistence to localStorage, and edit/delete are not yet implemented.
- **Column chooser** — design specifies it (toggle column visibility, persist choice), not yet built.
- **Dark mode** — token palette is light-only for now; the design suggests a dark mapping that we haven't wired to a toggle.
- **Pagination gap at the seam** — when polling continues while older pages are loaded, new entries can push past the page-1 boundary and leave a small gap before the first loaded older page. Mitigations: pause polling once older pages are loaded, or detect and stitch overlap.
- **`useEntryList` keeps olderPages in React state** — they don't get evicted when filters change. Adequate for now; can graduate to react-query `useInfiniteQuery` if memory matters.

## Infrastructure notes

- **Dev server**: Eyepiece's Vite runs on port `5175` (5173/5174 are usually taken by the host app). Run `npm run dev` in the Eyepiece dir while the host app's PHP server serves.
- **Composer process timeout**: disabled in `composer.json` (`config.process-timeout: 0`) so `composer run serve` against the testbench doesn't get killed at 300s.
- **Workbench seeder**: PSR-4 case-sensitive — the seeder lives at `workbench/database/Seeders/` (capital S). The build script intentionally skips `--seed` because composer's script runner mangles the `--seeder=Workbench\…` backslashes; not a real problem since the open `viewTelescope` gate doesn't need a seeded user.
- **Path-repo dev**: Eyepiece is installed in `/mnt/projects/kioku/kioku-api` via path repo + symlink. See `kioku-api/composer.json` `repositories` block.

## Tests + lint

- `composer run test` — Pest, one test (view override regression).
- `composer run analyse` — PHPStan level 4 on `src/`.
- `npm run lint` — ESLint flat config across `resources/js`.
- `npm run build` — production Vite build (~236 KB JS / 17 KB CSS gzipped to 74 KB / 4 KB).
