<?php

namespace Tests\Feature;

use App\Models\Publicacao;
use App\Models\SearchLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SearchAuditTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Mock manifest to avoid Vite errors during tests
        $this->withoutVite();
    }

    public function test_search_is_logged_in_database()
    {
        // Criar uma publicação para ter resultados
        Publicacao::factory()->create(['titulo' => 'Avaliação Educacional']);

        $response = $this->get('/publicacoes?search=Avaliação');

        $response->assertStatus(200);

        $this->assertDatabaseHas('search_logs', [
            'query' => 'Avaliação',
            'results_count' => 1
        ]);
    }

    public function test_invalid_search_syntax_is_logged_with_error()
    {
        // test_mode=1 desativa a auto-correção no controlador, mas só vale
        // para usuários autenticados (correção de segurança F002)
        $response = $this->actingAs(User::factory()->create())
            ->get('/publicacoes?search=(unbalanced&test_mode=1');

        $response->assertStatus(200);

        $log = SearchLog::where('query', '(unbalanced')->first();
        $this->assertNotNull($log, 'Log should exist');
        $this->assertNotNull($log->error, 'Log should have error');
    }

    public function test_search_filters_are_logged()
    {
        $this->get('/publicacoes?search=teste&fields=0,1&areas=0');

        $log = SearchLog::where('query', 'teste')->first();
        $this->assertNotNull($log);
        $this->assertArrayHasKey('fields', $log->filters);
        $this->assertEquals('0,1', $log->filters['fields']);
        $this->assertEquals('0', $log->filters['areas']);
    }
}
