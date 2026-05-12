<?php

namespace Tests\Feature\Search;

use App\Models\Publicacao;
use App\Models\SearchLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Garante que busca por frase (com aspas) respeita limites de palavra.
 * Ex: "arte" NÃO deve retornar "parte", "Duarte", "artefato".
 */
class WordBoundaryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    // --- Casos que DEVEM ser encontrados ---

    public function test_phrase_finds_word_in_middle_of_title(): void
    {
        Publicacao::factory()->create(['titulo' => 'Uma análise de arte na educação']);

        $this->get('/publicacoes?search=' . urlencode('"arte"'));

        $this->assertSearchResultCount('"arte"', 1);
    }

    public function test_phrase_finds_word_at_start_of_title(): void
    {
        Publicacao::factory()->create(['titulo' => 'Arte e educação no Brasil']);

        $this->get('/publicacoes?search=' . urlencode('"arte"'));

        $this->assertSearchResultCount('"arte"', 1);
    }

    public function test_phrase_finds_word_at_end_of_title(): void
    {
        Publicacao::factory()->create(['titulo' => 'Avaliação na arte']);

        $this->get('/publicacoes?search=' . urlencode('"arte"'));

        $this->assertSearchResultCount('"arte"', 1);
    }

    public function test_phrase_finds_exact_single_word_title(): void
    {
        Publicacao::factory()->create(['titulo' => 'arte']);

        $this->get('/publicacoes?search=' . urlencode('"arte"'));

        $this->assertSearchResultCount('"arte"', 1);
    }

    public function test_phrase_finds_word_before_comma(): void
    {
        Publicacao::factory()->create(['titulo' => 'arte, cultura e sociedade']);

        $this->get('/publicacoes?search=' . urlencode('"arte"'));

        $this->assertSearchResultCount('"arte"', 1);
    }

    public function test_phrase_finds_word_before_period(): void
    {
        Publicacao::factory()->create(['titulo' => 'Reflexões sobre arte. Um estudo']);

        $this->get('/publicacoes?search=' . urlencode('"arte"'));

        $this->assertSearchResultCount('"arte"', 1);
    }

    // --- Casos que NÃO devem ser encontrados ---

    public function test_phrase_does_not_match_word_embedded_at_end(): void
    {
        Publicacao::factory()->create(['titulo' => 'Trabalho de Duarte sobre avaliação']);

        $this->get('/publicacoes?search=' . urlencode('"arte"'));

        $this->assertSearchResultCount('"arte"', 0);
    }

    public function test_phrase_does_not_match_word_embedded_at_start(): void
    {
        Publicacao::factory()->create(['titulo' => 'artefatos culturais e educação']);

        $this->get('/publicacoes?search=' . urlencode('"arte"'));

        $this->assertSearchResultCount('"arte"', 0);
    }

    public function test_phrase_does_not_match_word_as_suffix(): void
    {
        Publicacao::factory()->create(['titulo' => 'Parte integrante da avaliação formativa']);

        $this->get('/publicacoes?search=' . urlencode('"arte"'));

        $this->assertSearchResultCount('"arte"', 0);
    }

    public function test_phrase_does_not_match_word_as_prefix(): void
    {
        Publicacao::factory()->create(['titulo' => 'artesanato e educação popular']);

        $this->get('/publicacoes?search=' . urlencode('"arte"'));

        $this->assertSearchResultCount('"arte"', 0);
    }

    // --- Comparação: busca sem aspas usa LIKE %termo% ---

    public function test_unquoted_search_matches_substrings(): void
    {
        Publicacao::factory()->create(['titulo' => 'Uma análise de arte na educação']);
        Publicacao::factory()->create(['titulo' => 'artefatos culturais']);
        Publicacao::factory()->create(['titulo' => 'Parte integrante']);
        Publicacao::factory()->create(['titulo' => 'Trabalho de Duarte']);

        $this->get('/publicacoes?search=arte');

        $this->assertSearchResultCount('arte', 4);
    }

    // --- Helper ---

    private function assertSearchResultCount(string $query, int $expected): void
    {
        $log = SearchLog::where('query', $query)->latest()->first();

        $this->assertNotNull($log, "Nenhum log de busca encontrado para: {$query}");
        $this->assertEquals(
            $expected,
            $log->results_count,
            "Busca por [{$query}] deveria retornar {$expected} resultado(s), mas retornou {$log->results_count}"
        );
    }
}
