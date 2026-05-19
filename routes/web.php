<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use App\Models\Publicacao;
use App\Http\Controllers\ContatoController;
use App\Http\Controllers\PublicacoesController;
use App\Http\Controllers\Admin\PublicacoesController as AdminPublicacoesController;
use App\Http\Controllers\Admin\SearchLogController as AdminSearchLogController;
use App\Http\Controllers\Admin\Lookups\AreaController;
use App\Http\Controllers\Admin\Lookups\EixoTematicoController;
use App\Http\Controllers\Admin\Lookups\FormaApresentacaoController;
use App\Http\Controllers\Admin\Lookups\SegmentoEducacionalController;
use App\Http\Controllers\Admin\Lookups\TipoInstituicaoController;
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
    Route::get('search-logs', [AdminSearchLogController::class, 'index'])->name('admin.search-logs');

    // CRUDs de lookups simples
    Route::prefix('cadastros')->name('admin.cadastros.')->group(function () {
        foreach ([
            'areas'                  => AreaController::class,
            'eixos-tematicos'        => EixoTematicoController::class,
            'segmentos-educacionais' => SegmentoEducacionalController::class,
            'turmas'                 => TurmaController::class,
            'tipos-instituicao'      => TipoInstituicaoController::class,
            'formas-apresentacao'    => FormaApresentacaoController::class,
        ] as $prefix => $controller) {
            Route::get($prefix, [$controller, 'index'])->name("{$prefix}.index");
            Route::post($prefix, [$controller, 'store'])->name("{$prefix}.store");
            Route::match(['put', 'patch'], "{$prefix}/{id}", [$controller, 'update'])->name("{$prefix}.update");
            Route::delete("{$prefix}/{id}", [$controller, 'destroy'])->name("{$prefix}.destroy");
            Route::post("{$prefix}/{id}/destroy-confirmed", [$controller, 'destroyConfirmed'])->name("{$prefix}.destroy-confirmed");
        }
    });
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
