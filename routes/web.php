<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\ContatoController;
use App\Http\Controllers\PublicacoesController;
use App\Http\Controllers\Admin\PublicacoesController as AdminPublicacoesController;
use App\Http\Controllers\Admin\SearchLogController as AdminSearchLogController;
use App\Http\Controllers\Admin\GeografiaController;
use App\Http\Controllers\Admin\Lookups\AreaController;
use App\Http\Controllers\Admin\Lookups\EixoTematicoController;
use App\Http\Controllers\Admin\Lookups\FormaApresentacaoController;
use App\Http\Controllers\Admin\Lookups\QualisCapeController;
use App\Http\Controllers\Admin\Lookups\SegmentoEducacionalController;
use App\Http\Controllers\Admin\Lookups\TipoInstituicaoController;
use App\Http\Controllers\Admin\Lookups\TipoPublicacaoController;
use App\Http\Controllers\Admin\Lookups\TurmaController;
use App\Http\Controllers\PesquisaController;
use App\Http\Controllers\EstatisticaController;
use App\Http\Controllers\GraficosController;

// Página inicial
Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/quem-somos', function () {
    return Inertia::render('QuemSomos', [
        'breadcrumb' => [
            ['label' => 'Página Inicial', 'href' => '/'],
            ['label' => 'Quem Somos'],
        ],
        'title' => 'Quem Somos',
    ]);
});

Route::get('/quem-somos/historico-equipe/{ano}', function ($ano) {
    $ano = (int) $ano;

    if ($ano < 2014 || $ano > 2024) {
        abort(404); // Retorna erro 404 se o ano estiver fora do intervalo
    }

    return Inertia::render('HistoricoEquipe', [
        'ano' => $ano,
        'breadcrumb' => [
            ['label' => 'Página Inicial', 'href' => '/'],
            ['label' => 'Quem Somos', 'href' => '/quem-somos'],
            ['label' => "Equipe {$ano}"],
        ],
        'title' => "Equipe do ano {$ano}",
    ]);
})->name('historico.equipe.show');

Route::get('/sobre', function () {
    return Inertia::render('Sobre', [
        'breadcrumb' => [
            ['label' => 'Página Inicial', 'href' => '/'],
            ['label' => 'Sobre o projeto'],
        ],
        'title' => 'Sobre o projeto',
    ]);
});

Route::get('/relatorios', function () {
    return Inertia::render('Relatorios', [
        'breadcrumb' => [
            ['label' => 'Página Inicial', 'href' => '/'],
            ['label' => 'Relatórios'],
        ],
        'title' => 'Relatórios',
    ]);
});

Route::get('/publicacoes', [PublicacoesController::class, 'index'])->name('publicacoes');
Route::get('/pesquisa', [PesquisaController::class, 'index'])->name('pesquisa');

Route::get('/quantitativo/{tipo}', [EstatisticaController::class, 'index'])->prefix('estatisticas')->name('total');
Route::get('/ano', [GraficosController::class, 'porAno'])->prefix('estatisticas/graficos')->name('graficos.form');

Route::get('/contato', function () {
    return Inertia::render('Contato', [
        'breadcrumb' => [
            ['label' => 'Página Inicial', 'href' => '/'],
            ['label' => 'Contato'],
        ],
        'title' => 'Contato',
    ]);
});

Route::post('/contato', [ContatoController::class, 'store'])->name('contato.store');

// Rota para a página de dashboard, protegida por autenticação e verificação de email
Route::middleware(['auth', 'verified'])->prefix('admin')->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
    Route::get('publicacoes', [AdminPublicacoesController::class, 'index'])->name('admin.publicacoes');
    Route::get('publicacoes/create', [AdminPublicacoesController::class, 'create'])->name('admin.publicacoes.create');
    Route::post('publicacoes', [AdminPublicacoesController::class, 'store'])->name('admin.publicacoes.store');
    Route::get('publicacoes/{id}/edit', [AdminPublicacoesController::class, 'edit'])->name('admin.publicacoes.edit');
    Route::match(['put', 'patch'], 'publicacoes/{id}', [AdminPublicacoesController::class, 'update'])->name('admin.publicacoes.update');
    Route::delete('publicacoes/{id}', [AdminPublicacoesController::class, 'destroy'])->name('admin.publicacoes.destroy');
    Route::get('autores/busca', [AdminPublicacoesController::class, 'buscarAutores'])->name('admin.autores.busca');
    Route::get('palavras-chave/busca', [AdminPublicacoesController::class, 'buscarPalavrasChave'])->name('admin.palavras-chave.busca');
    Route::get('search-logs', [AdminSearchLogController::class, 'index'])->name('admin.search-logs');
    Route::post('search-logs/cleanup', [AdminSearchLogController::class, 'cleanup'])->name('admin.search-logs.cleanup');
    Route::post('search-logs/truncate', [AdminSearchLogController::class, 'truncate'])->name('admin.search-logs.truncate');
    Route::get('search-logs/export', [AdminSearchLogController::class, 'export'])->name('admin.search-logs.export');

    // CRUD de geografia (país / região / estado)
    Route::prefix('cadastros/geografia')->name('admin.cadastros.geografia.')->group(function () {
        Route::get('/', [GeografiaController::class, 'index'])->name('index');

        Route::post('paises', [GeografiaController::class, 'storePais'])->name('paises.store');
        Route::match(['put', 'patch'], 'paises/{id}', [GeografiaController::class, 'updatePais'])->name('paises.update');
        Route::delete('paises/{id}', [GeografiaController::class, 'destroyPais'])->name('paises.destroy');
        Route::post('paises/{id}/destroy-confirmed', [GeografiaController::class, 'destroyPaisConfirmed'])->name('paises.destroy-confirmed');

        Route::post('regioes', [GeografiaController::class, 'storeRegiao'])->name('regioes.store');
        Route::match(['put', 'patch'], 'regioes/{id}', [GeografiaController::class, 'updateRegiao'])->name('regioes.update');
        Route::delete('regioes/{id}', [GeografiaController::class, 'destroyRegiao'])->name('regioes.destroy');
        Route::post('regioes/{id}/destroy-confirmed', [GeografiaController::class, 'destroyRegiaoConfirmed'])->name('regioes.destroy-confirmed');

        Route::post('estados', [GeografiaController::class, 'storeEstado'])->name('estados.store');
        Route::match(['put', 'patch'], 'estados/{id}', [GeografiaController::class, 'updateEstado'])->name('estados.update');
        Route::delete('estados/{id}', [GeografiaController::class, 'destroyEstado'])->name('estados.destroy');
        Route::post('estados/{id}/destroy-confirmed', [GeografiaController::class, 'destroyEstadoConfirmed'])->name('estados.destroy-confirmed');
    });

    // CRUDs de lookups simples
    Route::prefix('cadastros')->name('admin.cadastros.')->group(function () {
        foreach ([
            'areas'                  => AreaController::class,
            'eixos-tematicos'        => EixoTematicoController::class,
            'segmentos-educacionais' => SegmentoEducacionalController::class,
            'turmas'                 => TurmaController::class,
            'tipos-instituicao'      => TipoInstituicaoController::class,
            'formas-apresentacao'    => FormaApresentacaoController::class,
            'tipos-publicacao'       => TipoPublicacaoController::class,
            'qualis-capes'           => QualisCapeController::class,
        ] as $prefix => $controller) {
            Route::get($prefix, [$controller, 'index'])->name("{$prefix}.index");
            Route::post($prefix, [$controller, 'store'])->name("{$prefix}.store");
            Route::post("{$prefix}/inline", [$controller, 'storeInline'])->name("{$prefix}.store-inline");
            Route::match(['put', 'patch'], "{$prefix}/{id}", [$controller, 'update'])->name("{$prefix}.update");
            Route::delete("{$prefix}/{id}", [$controller, 'destroy'])->name("{$prefix}.destroy");
            Route::post("{$prefix}/{id}/destroy-confirmed", [$controller, 'destroyConfirmed'])->name("{$prefix}.destroy-confirmed");
        }
    });
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
