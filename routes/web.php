<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\ContatoController;
use App\Mail\SendEmail;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

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

Route::get('/sobre', function () {
    return Inertia::render('Sobre', [
        'breadcrumb' => [
            ['label' => 'Página Inicial', 'href' => '/'],
            ['label' => 'Sobre o projeto'],
        ],
        'title' => 'Sobre o projeto',
    ]);
});

Route::get('/publicacoes', function () {
    return Inertia::render('Publicacoes', [
        'breadcrumb' => [
            ['label' => 'Página Inicial', 'href' => '/'],
            ['label' => 'Publicações científicas'],
        ],
        'title' => 'Publicações científicas',
    ]);
});

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
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
