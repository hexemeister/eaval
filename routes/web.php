<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\QuemSomosController;

use Illuminate\Support\Facades\DB;

// Página inicial
Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// Páginas estáticas
Route::inertia('quem-somos', 'QuemSomos', [
    'title' => 'Quem Somos',
]);

Route::inertia('sobre', 'Sobre', [
    'title' => 'Sobre o projeto',
]);

Route::inertia('contato', 'Contato', [
    'title' => 'Contato',
]);

// Rota para a página de dashboard, protegida por autenticação e verificação de email
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
