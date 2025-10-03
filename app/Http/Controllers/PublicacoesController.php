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
        // $mysql = "SELECT
        //             p.titulo,
        //             GROUP_CONCAT(a.nome SEPARATOR '\n' ORDER BY ap.ordem ASC) AS autores,
        //             p.ano,
        //             p.link
        //         FROM
        //             publicacao p
        //         LEFT JOIN autor_publicacao ap ON p.id = ap.publicacao_id
        //         LEFT JOIN autor a ON a.id = ap.autor_id
        //         GROUP BY
        //             p.id, p.titulo, p.ano, p.link
        //         ORDER BY
        //             p.incluida_em DESC, p.titulo ASC;"

        $results = DB::select(
            "SELECT
                p.titulo,
                (SELECT GROUP_CONCAT(a2.nome, '\n') 
                FROM autor_publicacao ap2 
                LEFT JOIN autor a2 ON a2.id = ap2.autor_id 
                WHERE ap2.publicacao_id = p.id 
                ORDER BY ap2.ordem IS NULL, ap2.ordem ASC) AS autores, -- Prioriza NULL e ordena por ordem ASC
                p.ano,
                p.link
            FROM
                publicacao p
            LEFT JOIN autor_publicacao ap ON p.id = ap.publicacao_id
            LEFT JOIN autor a ON a.id = ap.autor_id
            GROUP BY
                p.id, p.titulo, p.ano, p.link
            ORDER BY
                p.incluida_em DESC, p.titulo ASC;"
        );

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
