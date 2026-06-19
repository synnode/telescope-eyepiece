<?php

namespace Eyepiece;

use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;

class EyepieceServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->loadViews();
        $this->registerPublishing();
    }

    /**
     * Register our layout view under the `telescope` namespace and prepend
     * its path so it wins lookup over the original package's layout.
     */
    protected function loadViews(): void
    {
        $path = __DIR__.'/../resources/views';

        $this->loadViewsFrom($path, 'telescope');

        View::prependNamespace('telescope', $path);
    }

    protected function registerPublishing(): void
    {
        if (! $this->app->runningInConsole()) {
            return;
        }

        $this->publishes([
            __DIR__.'/../public' => public_path('vendor/eyepiece'),
        ], 'eyepiece-assets');
    }
}
