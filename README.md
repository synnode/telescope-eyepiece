# Telescope Eyepiece

A reskin/redesign companion package for [Laravel Telescope](https://github.com/laravel/telescope). Replaces the default Vue dashboard with a custom React SPA, **without modifying or forking Telescope itself**.

## How it works

- Telescope's `HomeController` returns `view('telescope::layout')`. The Eyepiece service provider prepends its own path on the `telescope` view namespace, so `resources/views/layout.blade.php` in this package wins lookup.
- Eyepiece's layout loads a small React SPA (Vite-built) instead of Telescope's bundled Vue assets.
- The React app consumes the existing `/telescope-api/*` JSON endpoints — nothing about Telescope's recording, storage, watchers, or auth changes.

## Install (host app)

```bash
composer require michael/telescope-eyepiece
php artisan vendor:publish --tag=eyepiece-assets
```

Visit `/telescope` (or your configured Telescope path) — it now serves the Eyepiece UI.

## Develop

```bash
npm install
npm run dev      # Vite dev server on :5173, blade falls back to it when no manifest exists
npm run build    # production build into public/ (manifest.json + assets/)
```

The blade layout auto-detects: if `public/.vite/manifest.json` exists it serves built assets; otherwise it loads from `http://localhost:5173`.

## Layout

```
src/EyepieceServiceProvider.php    PHP entry: view override + asset publish
resources/views/layout.blade.php   The single blade view that hosts the SPA
resources/js/app.tsx               React entry
resources/js/App.tsx               Router + chrome
resources/js/lib/api.ts            Typed wrapper around /telescope-api/*
resources/js/lib/telescope.ts      window.Telescope script vars + CSRF
resources/js/screens/*.tsx         One screen per Telescope entry type
public/                            Built assets (gitignored)
```

## Status

Skeleton only. One working screen (Requests) — the rest are placeholders to be filled in as the design is built out.
