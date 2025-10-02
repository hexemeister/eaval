<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PublicacoesController extends Controller
{
    public function index(): Response
    {
        $results = DB::select('SELECT * FROM publicacao ORDER BY incluida_em DESC, titulo ASC');
        
        return Inertia::render('Publicacoes', [
            'breadcrumb' => [
                ['label' => 'Página Inicial', 'href' => '/'],
                ['label' => 'Publicações científicas'],
            ],
            'title' => 'Publicações científicas',
            'results' => $results,
        ]);
    }
}
