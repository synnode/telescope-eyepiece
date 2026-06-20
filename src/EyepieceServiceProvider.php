<?php

namespace Eyepiece;

use Eyepiece\Http\Controllers\CountsController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;

class EyepieceServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->loadViews();
        $this->loadRoutes();
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

    /**
     * Register Eyepiece's own JSON endpoints under the same path prefix and
     * middleware group as Telescope's API, so they inherit the same auth
     * gate and CSRF handling without any extra config.
     */
    /**
     * Eyepiece's routes live at /eyepiece-api/* — deliberately outside
     * Telescope's path prefix so they aren't swallowed by Telescope's
     * /{view?} catch-all (which is registered first via package discovery
     * order and would otherwise return the SPA HTML instead of our JSON).
     * Auth still rides the same 'telescope' middleware group.
     */
    protected function loadRoutes(): void
    {
        Route::group([
            'domain' => config('telescope.domain', null),
            'prefix' => 'eyepiece-api',
            'middleware' => 'telescope',
        ], function () {
            Route::get('/counts', [CountsController::class, 'index']);
            Route::post('/batch-query-counts', [CountsController::class, 'batchQueryCounts']);
        });
    }

    protected function registerPublishing(): void
    {
        if (! $this->app->runningInConsole()) {
            return;
        }

        $this->publishes([
            __DIR__.'/../public' => public_path('eyepiece'),
        ], 'eyepiece-assets');
    }
}
