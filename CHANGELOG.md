# Changelog

## v1.2.0 — 2026-06-20

### Added

- Request detail drawer now shows the request payload (POST body) as pretty-printed JSON, and the response body below the SQL queries. Both sections auto-hide on GET requests or when Telescope didn't capture content.

## v1.1.1 — 2026-06-20

### Fixed

- Blade now emits root-relative asset paths (`/eyepiece/...`) instead of going through `asset()`. `asset()` builds absolute URLs from `APP_URL` and silently drops the port when the host runs on a non-standard one (e.g. `:8006`), which sends asset requests to the wrong vhost.

## v1.1.0 — 2026-06-20

### Changed

- **Breaking:** assets now publish to `public/eyepiece/` instead of `public/vendor/eyepiece/`. Many host apps reverse-proxy or redirect `/vendor/*` URLs for security (composer's `vendor/` should never be public), which broke asset loading after install. Existing installs must re-publish and remove the old directory:

  ```bash
  php artisan vendor:publish --tag=eyepiece-assets --force
  rm -rf public/vendor/eyepiece
  ```

## v1.0.0 — 2026-06-20

First public release.

### Screens

All 18 Telescope entry types ported as React screens, plus Dumps and Monitored Tags:

- Requests (with SQL count per row, request user, IP, threshold-coloured durations)
- Queries (with file:line, slow-only filter, family-hash drawer)
- Exceptions (line preview, full trace, mark-as-resolved)
- Logs (level chips, color-coded message banner)
- Jobs (status outcome, exception block on failed jobs)
- Commands (exit code, arguments + options)
- Mail (recipients KV, iframe preview, .eml download)
- Cache, Redis, Views, Models, Notifications, Events, Gates, Schedule, HTTP Client, Batches
- Dumps (Symfony HtmlDumper output, wrong-cache warning)
- Monitored Tags (CRUD form)

### Shell

- Header with logo, brand + app name, recording status pill, pause/clear/refresh/theme buttons
- Sidebar (Watchers / Data / Diagnostics / Settings sections) with per-watcher entry counts
- Slide-over detail drawer (520px, anchored right) for every list screen
- Dark + light theme, follows `prefers-color-scheme` on first paint, persisted in localStorage
- Mobile-responsive: sidebar becomes a slide-in drawer; filter form + saved views collapse behind a toggle
- Red banner when Telescope recording is paused

### Data

- Cursor pagination via `useEntryList` hook (polls page 1 every 2s, Load more for older pages)
- URL state for filters and selected entry id on every screen
- Filter form per screen (search, multi-select chips for type-specific facets)
- Saved views with localStorage persistence (presets + user-defined, named via in-style modal)
- Column chooser with localStorage persistence (Verb / Path mandatory on Requests)

### Backend

- Custom `eyepiece-api` routes for sidebar counts and per-batch SQL counts (both behind Telescope's middleware group)
- View override registered via `View::prependNamespace('telescope', ...)` — no fork, no upstream modification
- `Telescope::stopRecording()` in Eyepiece's own controllers to avoid feedback loops
