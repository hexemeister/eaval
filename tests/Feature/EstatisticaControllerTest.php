<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

it('retorna 404 para tipo de estatística inválido', function () {
    $this->get('/estatisticas/tipo-invalido')->assertNotFound();
});

it('renderiza VisaoGeral com props corretamente tipadas', function () {
    $this->get('/estatisticas/visao-geral')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Estatisticas/VisaoGeral')
            ->whereType('totalPublicacoes', 'integer')
            ->whereType('anoMin', 'integer')
            ->whereType('anoMax', 'integer')
            ->whereType('totalAutores', 'integer')
            ->whereType('totalPeriodicos', 'integer')
            ->whereType('totalPalavrasChave', 'integer')
            ->whereType('percentualDOI', 'double|integer')
            ->whereType('percentualResumo', 'double|integer')
            ->whereType('mediaAutoresPorArtigo', 'double|integer')
            ->whereType('mediaPalavrasChaveArtigo', 'double|integer')
        );
});

it('renderiza Generico para por-ano com hasYearFilter ativo', function () {
    $this->get('/estatisticas/ano')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Estatisticas/Quantitativos/Generico')
            ->has('dados')
            ->where('colunas', ['Ano', 'Total'])
            ->where('hasYearFilter', true)
            ->has('title')
        );
});

it('renderiza Generico para todos os outros tipos de estatísticas', function (string $tipo) {
    $this->get("/estatisticas/{$tipo}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Estatisticas/Quantitativos/Generico')
            ->has('dados')
            ->has('colunas')
            ->has('title')
        );
})->with([
    'autor',
    'palavra-chave',
    'periodico',
    'qualis',
    'area-conhecimento',
    'tipo-publicacao',
    'eixo-tematico',
    'segmento-educacional',
    'forma-apresentacao',
    'estado',
    'regiao',
    'pais',
]);
