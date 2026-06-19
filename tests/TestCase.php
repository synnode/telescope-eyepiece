<?php

namespace Eyepiece\Tests;

use Eyepiece\EyepieceServiceProvider;
use Laravel\Telescope\TelescopeServiceProvider;
use Orchestra\Testbench\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function getPackageProviders($app): array
    {
        return [
            TelescopeServiceProvider::class,
            EyepieceServiceProvider::class,
        ];
    }
}
