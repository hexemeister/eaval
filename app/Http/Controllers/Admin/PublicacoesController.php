<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class PublicacoesController extends Controller
{
    public function index()
    {
        $publicacoes = \App\Models\Publicacao::with('autores')
            ->orderBy('id', 'desc')
            ->paginate(20)
            ->through(fn ($pub) => [
                'id' => $pub->id,
                'title' => $pub->titulo,
                'authors' => $pub->autores->pluck('nome')->implode(', '),
                'year' => $pub->ano,
            ]);

        return inertia('admin/Publicacoes/Index', [
            'publicacoes' => $publicacoes,
        ]);
    }
}