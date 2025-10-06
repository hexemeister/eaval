<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PesquisaController extends Controller
{
    public function index(): Response
    {
        $results = DB::select('SELECT * FROM publicacao ORDER BY incluida_em DESC, titulo ASC');
        
        return Inertia::render('Pesquisa', [
            'breadcrumb' => [
                ['label' => 'Página Inicial', 'href' => '/'],
                ['label' => 'Pesquisa avançada'],
            ],
            'title' => 'Pesquisa avançada',
            'results' => $results,
        ]);
    }
}
