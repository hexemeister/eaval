<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Models\TermoExcecaoCaso;
use App\Services\NormalizacaoTextoService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class NormalizacaoTextoTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::forget('termos_excecao_caso');
    }

    public function test_sentence_case_capitaliza_primeira_palavra(): void
    {
        $this->assertSame('Avaliação formativa', NormalizacaoTextoService::sentenceCase('avaliação formativa'));
    }

    public function test_sentence_case_converte_maiusculas_para_minusculas(): void
    {
        $this->assertSame('Educação básica', NormalizacaoTextoService::sentenceCase('EDUCAÇÃO BÁSICA'));
    }

    public function test_sentence_case_respeita_excecoes(): void
    {
        TermoExcecaoCaso::create(['termo' => 'BNCC']);
        Cache::forget('termos_excecao_caso');

        $this->assertSame('A BNCC no contexto escolar', NormalizacaoTextoService::sentenceCase('a bncc no contexto escolar'));
    }

    public function test_sentence_case_sem_excecao_normaliza_palavra_interna(): void
    {
        $this->assertSame('Avaliação no brasil', NormalizacaoTextoService::sentenceCase('avaliação no BRASIL'));
    }
}
