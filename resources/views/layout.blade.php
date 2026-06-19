<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="robots" content="noindex, nofollow">

    <title>Eyepiece{{ config('app.name') ? ' — ' . config('app.name') : '' }}</title>

    @php
        $scriptVars = \Laravel\Telescope\Telescope::scriptVariables();
        $manifestPath = public_path('vendor/eyepiece/.vite/manifest.json');
        $manifest = file_exists($manifestPath)
            ? json_decode(file_get_contents($manifestPath), true)
            : null;
        $entry = $manifest['resources/js/app.tsx'] ?? null;
    @endphp

    <script>
        window.Telescope = @json($scriptVars);
    </script>

    @if ($entry)
        <link rel="stylesheet" href="{{ asset('vendor/eyepiece/'.$entry['css'][0]) }}">
        <script type="module" src="{{ asset('vendor/eyepiece/'.$entry['file']) }}"></script>
    @else
        <!-- Dev: run `npm run dev` and load Vite directly -->
        <script type="module" src="http://localhost:5173/@vite/client"></script>
        <script type="module" src="http://localhost:5173/resources/js/app.tsx"></script>
    @endif
</head>
<body>
    <div id="eyepiece"></div>
</body>
</html>
