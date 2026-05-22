<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        // Garante banco em memória antes que RefreshDatabase leia a config,
        // protegendo database/database.sqlite mesmo quando há config cache ativo.
        if ($this->app === null) {
            $app = $this->createApplication();
            $app['config']->set('database.default', 'sqlite');
            $app['config']->set('database.connections.sqlite.database', ':memory:');
            $this->app = $app;
        }

        parent::setUp();
    }
}
