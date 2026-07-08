<?php

declare(strict_types=1);

namespace Tests\Feature\Search;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * test_mode expõe SQL gerado, bindings e query log da busca — não pode
 * vazar para visitantes anônimos (finding F002 da auditoria de 2026-05-14).
 */
class TestModeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    public function test_guest_does_not_receive_test_result(): void
    {
        $this->get('/publicacoes?search=avaliacao&test_mode=1')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('testResult', null));
    }

    public function test_authenticated_user_receives_test_result(): void
    {
        $this->actingAs(User::factory()->create())
            ->get('/publicacoes?search=avaliacao&test_mode=1')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->whereNot('testResult', null));
    }
}
