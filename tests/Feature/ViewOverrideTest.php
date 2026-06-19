<?php

it('resolves telescope::layout to the Eyepiece blade, not the upstream one', function () {
    $resolvedPath = view('telescope::layout')->getPath();

    $expected = realpath(__DIR__.'/../../resources/views/layout.blade.php');

    expect(realpath($resolvedPath))->toBe($expected);
});
