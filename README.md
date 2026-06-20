# Telescope Eyepiece

A reskin/redesign companion package for [Laravel Telescope](https://github.com/laravel/telescope). Replaces the default Vue dashboard with a custom React SPA, **without modifying or forking Telescope itself**.

## How it works

- Telescope's `HomeController` returns `view('telescope::layout')`. The Eyepiece service provider prepends its own path on the `telescope` view namespace, so this package's `resources/views/layout.blade.php` wins lookup.
- The Eyepiece layout loads a pre-built React SPA (Vite) instead of Telescope's bundled Vue assets.
- The React app consumes the existing `/telescope-api/*` JSON endpoints — recording, watchers, storage, and the `Gate::viewTelescope` authorization gate all keep working untouched.
- A small `eyepiece-api/*` sidecar (two endpoints) adds entry counts for the sidebar and per-batch SQL counts for the Requests table.

## Install

```bash
composer require synnode/telescope-eyepiece
php artisan vendor:publish --tag=eyepiece-assets
```

Visit `/telescope` (or whatever path you set in `config/telescope.php`) — it now serves the Eyepiece UI.

The package auto-discovers, no provider registration needed. Authorization keeps using your existing `Gate::define('viewTelescope', …)` from `TelescopeServiceProvider`.

### Upgrading

Re-run `vendor:publish --tag=eyepiece-assets --force` after any version bump so the published assets and Vite manifest stay in sync with the installed package.

## Develop

```bash
npm install
npm run dev      # Vite dev server on :5175, blade falls back to it when no manifest exists
npm run build    # production build into public/ (manifest.json + assets/)
```

The blade layout auto-detects: if `public/.vite/manifest.json` exists in the host app's `public/eyepiece/` (post-`vendor:publish`), it serves built assets; otherwise it loads from `http://localhost:5175`.

For development against a real host app, add a path repo to the host's `composer.json`:

```json
"repositories": [
    { "type": "path", "url": "/abs/path/to/telescope-eyepiece", "options": { "symlink": true } }
],
"require": {
    "synnode/telescope-eyepiece": "@dev"
}
```

Then run `npm run dev` from this package and load the host app normally — the symlinked source is picked up live, and Vite HMR works through the blade fallback.

## Tests + lint

```bash
composer run test       # Pest, view-override regression
composer run analyse    # PHPStan level 4 on src/
npm run lint            # ESLint flat config across resources/js
```

## Requirements

- PHP 8.1+
- Laravel 10 / 11 / 12 / 13
- `laravel/telescope ^5.0`

## License

MIT — see `LICENSE`.
