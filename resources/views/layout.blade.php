<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="robots" content="noindex, nofollow">

    <title>Eyepiece{{ config('app.name') ? ' — ' . config('app.name') : '' }}</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap">

    @php
        $scriptVars = \Laravel\Telescope\Telescope::scriptVariables();
        $manifestPath = public_path('vendor/eyepiece/.vite/manifest.json');
        $manifest = file_exists($manifestPath)
            ? json_decode(file_get_contents($manifestPath), true)
            : null;
        $entry = $manifest['resources/js/main.tsx'] ?? null;
    @endphp

    <script>
        window.Telescope = @json($scriptVars);
        (function () {
            try {
                var stored = localStorage.getItem('eyepiece-theme');
                var theme = (stored === 'light' || stored === 'dark')
                    ? stored
                    : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                document.documentElement.dataset.theme = theme;
            } catch (e) {}
        })();
    </script>

    @if ($entry)
        <link rel="stylesheet" href="{{ asset('vendor/eyepiece/'.$entry['css'][0]) }}">
        <script type="module" src="{{ asset('vendor/eyepiece/'.$entry['file']) }}"></script>
    @else
        {{-- Dev: run `npm run dev` and load Vite directly. --}}
        {{-- React Fast Refresh preamble must run before any TSX module. --}}
        <script type="module">
            import RefreshRuntime from 'http://localhost:5175/@@react-refresh'
            RefreshRuntime.injectIntoGlobalHook(window)
            window.$RefreshReg$ = () => {}
            window.$RefreshSig$ = () => (type) => type
            window.__vite_plugin_react_preamble_installed__ = true
        </script>
        <script type="module" src="http://localhost:5175/@@vite/client"></script>
        <script type="module" src="http://localhost:5175/resources/js/main.tsx"></script>
    @endif
</head>
<body>
    <div id="eyepiece"></div>
</body>
</html>
