<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Models\SearchLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SearchLogTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    public function test_guests_cannot_access_search_logs()
    {
        $response = $this->get(route('admin.search-logs'));
        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_access_search_logs()
    {
        $user = User::factory()->create();
        SearchLog::create(['query' => 'teste', 'results_count' => 1]);

        $response = $this->actingAs($user)->get(route('admin.search-logs'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('admin/SearchLogs/Index')
            ->has('logs.data', 1)
        );
    }
}
