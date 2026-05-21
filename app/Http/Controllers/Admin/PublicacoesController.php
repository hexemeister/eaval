<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Publicacao;
use Inertia\Inertia;
use Inertia\Response;

class PublicacoesController extends Controller
{
    public function index(): Response
    {
        $publicacoes = Publicacao::with(['autores', 'tipoPublicacao'])
            ->orderBy('id')
            ->get()
            ->map(fn ($pub) => [
                'id'      => $pub->id,
                'title'   => $pub->titulo,
                'authors' => $pub->autores->pluck('nome')->implode(', '),
                'year'    => $pub->ano,
                'tipo'    => $pub->tipoPublicacao?->nome,
                'doi'     => $pub->doi,
                'isbn'    => $pub->isbn,
            ]);

        return Inertia::render('admin/Publicacoes/Index', [
            'publicacoes' => $publicacoes,
        ]);
    }
}
